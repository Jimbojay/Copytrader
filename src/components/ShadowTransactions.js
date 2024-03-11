import axios from 'axios';
import { ethers } from 'ethers';
import React, { useState, useEffect, useMemo } from 'react';
import Table from 'react-bootstrap/Table';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { useSelector } from 'react-redux';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Alert from 'react-bootstrap/Alert';
import { Modal } from 'react-bootstrap';
import { FiSettings } from 'react-icons/fi';

import etherscanLogo from '../logo-etherscan_transparant.png';
import metamaskLogo from '../logo_metamask.png';

import styleSelectBox from '../helpers/styling';

import UNISWAP_ROUTER_ABI from '../abis/UniswapV2_Router.json';
import UNISWAP_ABI from '../abis/UniswapV2.json';
import UNISWAP_FACTORY_ABI from '../abis/UniswapV2_Factory.json';

import TOKEN_ABI from '../abis/Token.json'

import { 
  swapTokens
} from '../store/interactions'

// require('dotenv').config();

import {
    formatTokenAmount,
    getTimeSince,
    addTokenToMetaMask
} from '../helpers/helpers'

const etherscanApiKey = process.env.REACT_APP_etherscanApiKey
const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
const providerRPC = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);

const address_Router = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const address_Factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

const TransactionsTable = () => {

  const account = useSelector(state => state.provider.account)
  const provider = useSelector(state => state.provider.connection)

  //Loading states
  const [loadingStatus, setLoadingStatus] = useState({
    transactions: false,
    decoding: false
  });
  //Related to original transaction
  const [receipts, setReceipts] = useState([]);

  //Parameters copy trade
  const [inputValues, setInputValues] = useState({});
  const [slippage, setSlippage] = useState('0.5');

  // Front-end table filters
  const [selectedAlias, setSelectedAlias] = useState([]);
  const [selectedTokenTo, setSelectedTokenTo] = useState([]);
  // Add state for filtered transactions
  const [filteredReceipts, setFilteredReceipts] = useState([]);

  //States for setting-gear icon
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const handleSlippageModalClose = () => setShowSlippageModal(false);
  const handleSlippageModalShow = () => setShowSlippageModal(true); 

  const factoryContract = new ethers.Contract(address_Factory, UNISWAP_FACTORY_ABI, providerRPC);

  const tokenDetailsCache = useMemo(() => ({}), []);

  async function getOrFetchTokenDetails(tokenAddress) {
    if (!tokenDetailsCache[tokenAddress]) {
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, providerRPC);
      const [decimals, symbol] = await Promise.all([
        tokenContract.decimals(),
        tokenContract.symbol(),
      ]);
      tokenDetailsCache[tokenAddress] = { decimals, symbol };
    }
    return tokenDetailsCache[tokenAddress];
  }

  async function getRate(token0Address, token1Address, tokenFromDecimals, tokenToDecimals) {
    const pairAddress = await factoryContract.getPair(token0Address, token1Address);
    const pairContract = new ethers.Contract(pairAddress, UNISWAP_ABI, providerRPC);
    const reserves = await pairContract.getReserves();
    const token0 = await pairContract.token0();
    const token1 = await pairContract.token1();

    let _rate;
    if (token0Address === token0) {
        _rate = parseFloat(ethers.utils.formatUnits(reserves[0], tokenFromDecimals)) / parseFloat(ethers.utils.formatUnits(reserves[1], tokenToDecimals))
    } else if (token0Address === token1) {
        _rate = parseFloat(ethers.utils.formatUnits(reserves[1], tokenFromDecimals)) / parseFloat(ethers.utils.formatUnits(reserves[0], tokenToDecimals))
    }
    return _rate;
  }
  const shadows = useSelector((state) => state.shadowAddresses) || [];

  // Extract all shadowAddresses into a separate array and convert them to lowercase
  const shadowAddresses = shadows
    .filter(shadow => shadow.walletAddress !== undefined) // Keep only items with walletAddress
    .map(shadow => ({
      walletAddress: shadow.walletAddress.toLowerCase(),
      alias: shadow.alias // Include the alias
  }));


  // New state to track input values

  const handleInputChange = (hash, value) => {
    // Check if the input value is negative
    if (value < 0) {
      // Show a window popup error
      window.alert("Negative numbers are not allowed.");
      return; // Stop further execution
    }
    setInputValues(prev => ({ ...prev, [hash]: value }));
  };

  const handleSwap = async (tx) => {
    if (account) {
      const amount = inputValues[tx.hash] || ''; // Get amount from inputValues state

      if (amount === '' || parseFloat(amount) <= 0) {
          window.alert("Please enter a positive amount");
          return; // Stop further execution
      }

      // console.log('test:', amount, inputValues, tx.hash, tx);

      // Call swapTokens function with the required parameters
      await swapTokens(
        provider, 
        tx.swapDetails.tokenFrom, 
        tx.swapDetails.tokenTo, 
        tx.swapDetails.decimalsFromToken, 
        tx.swapDetails.decimalsToToken, 
        amount
        ,slippage
      );

      // Clear the input field after successful swap
      setInputValues(prev => ({ ...prev, [tx.hash]: '' }));
    } else {
      window.alert("Please connect your account");
    }
  };

  // Handle input change for slippage
  const handleSlippageChange = (e) => {
    setSlippage(e.target.value);
  };

  // Validate slippage on blur
  const validateSlippage = () => {
    if (slippage && parseFloat(slippage) < 0.5) {
      alert("The minimum slippage is 0.5%"); // Show popup error
      setSlippage(''); // Optionally reset the invalid input
    }
  };

  useEffect(() => {
    const fetchTransactionsAndReceipts = async () => {
      const apiCallLabel = `API Call Time ${new Date().getTime()}`; 
      const transformLabel = `Transform Time ${new Date().getTime()}`; 


      setLoadingStatus({ transactions: false, decoding: false});
      const contractInterfaceRouter = new ethers.utils.Interface(UNISWAP_ROUTER_ABI);
      const contractInterface = new ethers.utils.Interface(UNISWAP_ABI);
      console.time(apiCallLabel)

      try {
        const currentBlock = await providerRPC.getBlockNumber();
        const blocksPerMonth = 4 * 60 * 24 * 30; // Approximation
        const startBlock = currentBlock - (3 * blocksPerMonth);

        const apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address_Router}&startblock=${startBlock}&endblock=${currentBlock}&sort=desc&apikey=${etherscanApiKey}`;

        const response = await axios.get(apiUrl);
        console.log(response)
        console.timeEnd(apiCallLabel); 
        setLoadingStatus({ transactions: true, decoding: false });
        
        console.time(transformLabel)
        if (response.data.status === "1" && response.data.message === "OK") {
          const transactions = response.data.result;

          const filteredTransactions = transactions.filter(tx =>
            shadowAddresses.some(addr => addr.walletAddress === tx.from.toLowerCase())
          );

          console.log('TEST transactions:', filteredTransactions)

          const transactionsWithDetails = await Promise.all(filteredTransactions.map(async tx => {
                
            const shadowAddressObj = shadowAddresses.find(addr => addr.walletAddress === tx.from.toLowerCase());

            let decodedInputData = {};
            try {
              decodedInputData = contractInterfaceRouter.parseTransaction({ data: tx.input });
            } catch (error) {
              console.error('Error decoding transaction input:', tx.hash, error);
            }

            const receipt = await providerRPC.getTransactionReceipt(tx.hash);

            console.log('Receipts:', receipt);  

            // Filtering out failed transactions by checking receipt status
            if (receipt.status === 0) {
              console.log(`Skipping failed transaction with hash: ${tx.hash}`);
              return null; // Skip adding this transaction to the results
            }

            let swapDetails = {
              hash: tx.hash,
              walletAddress: tx.from,
              alias: shadowAddressObj ? shadowAddressObj.alias : 'Unknown', // Use the alias
              tokenFrom: undefined,
              tokenTo: undefined,
              tokenFromAmount: undefined,
              tokenToAmount: undefined,
              effectiveSwapRate: undefined,
              currentRate: undefined,
              percentageDifference: undefined,
              // decodedLogNames: [], // Placeholder for decoded logs,
              decimalsToToken: undefined,
              decimalsFromToken: undefined
            };

            if (decodedInputData && decodedInputData.args && decodedInputData.args.path) {
              swapDetails.tokenFrom = decodedInputData.args.path[0];
              swapDetails.tokenTo = decodedInputData.args.path.length > 1 ? decodedInputData.args.path[1] : undefined;
            }
                  
            // Fetch token details and extract decimals for tokens
            const { decimals: decimalsFromToken } = await getOrFetchTokenDetails(swapDetails.tokenFrom).catch(console.error);
            const { decimals: decimalsToToken } = await getOrFetchTokenDetails(swapDetails.tokenTo).catch(console.error);
            swapDetails.decimalsFromToken = await decimalsFromToken;
            swapDetails.decimalsToToken = await decimalsToToken;


            const timeSince = getTimeSince(tx.timeStamp); // Assuming tx.timeStamp is the Unix timestamp of the transaction
            swapDetails.timeSince = timeSince;

            const rate = await getRate(swapDetails.tokenFrom, swapDetails.tokenTo, decimalsFromToken, decimalsToToken).catch(console.error);


            if (rate) {
              // const rate = parseFloat(reserves.reserve0) / parseFloat(reserves.reserve1); // Adjust based on which token is token0 and token1 in the pair
              swapDetails.currentRate = rate; // Store the rate with a fixed number of decimal places
            }

            let decodedLogs = []; // Array to store entire decoded logs

            for (const log of receipt.logs) {
              try {      
                const decodedLog = contractInterface.parseLog({ topics: log.topics, data: log.data });
                decodedLogs.push(decodedLog); // Push the entire decoded log
                // swapDetails.decodedLogNames.push(decodedLog.name); // Store only the event names

                if (decodedLog.name === "Swap") { 

                  if(decodedLog.args[1] == '0') {
                    swapDetails.tokenFromAmount = ethers.utils.formatUnits(decodedLog.args[2], decimalsFromToken);
                    swapDetails.tokenToAmount = ethers.utils.formatUnits(decodedLog.args[3], decimalsToToken);
                  } else {
                    swapDetails.tokenFromAmount = ethers.utils.formatUnits(decodedLog.args[1], decimalsFromToken);
                    swapDetails.tokenToAmount = ethers.utils.formatUnits(decodedLog.args[4], decimalsToToken);
                  }

                  // Calculate the effective swap rate, ensuring not to divide by zero
                  const effectiveSwapRate = swapDetails.tokenToAmount && swapDetails.tokenToAmount !== '0' 
                    ? parseFloat(swapDetails.tokenFromAmount) / parseFloat(swapDetails.tokenToAmount) 
                    : 0; // You might want to handle this case more gracefully

                  // Add the effectiveSwapRate to swapDetails
                  swapDetails.effectiveSwapRate = effectiveSwapRate; // Limiting the decimal places for display                            
                  
                  // const uniqueAliases = [...new Set(receipts.map(tx => tx.swapDetails.alias))];
                  // const uniqueTokens = [...new Set(receipts.map(tx => tx.swapDetails.tokenToSymbol))];
                
                }
              } catch (error) {
                // This catch block will handle errors for logs that don't match the ABI
              }
            };

            if (swapDetails.currentRate && swapDetails.effectiveSwapRate) {
              // Calculate the percentage difference
              const percentageDifference = ((parseFloat(swapDetails.currentRate) - parseFloat(swapDetails.effectiveSwapRate)) / parseFloat(swapDetails.effectiveSwapRate)) * 100;

              // Store the percentage difference in the swapDetails object, formatted to 2 decimal places
              swapDetails.percentageDifference = percentageDifference.toFixed(2);
            }

            return { ...tx, decodedInputData, receipt, swapDetails, decodedLogs };
          }));

          const validTransactions = transactionsWithDetails.filter(tx => tx && tx.swapDetails.tokenFrom && tx.swapDetails.tokenTo);
          console.log('Transactions with Receipts:', validTransactions);
            

          setReceipts(validTransactions);
          setLoadingStatus({ transactions: true, decoding: true });
        } else {
          console.error('No transactions found or error fetching transactions:', response.data.result);
        }

        console.timeEnd(transformLabel)
      } catch (error) {
        console.error('Error fetching transactions or receipts:', error);
      }
    };

    fetchTransactionsAndReceipts();
  }, []);

  // Extract unique values for Alias and Token to dropdowns
  const uniqueAliases = useMemo(() => {
    const aliases = receipts.map(tx => ({ value: tx.swapDetails.alias, label: tx.swapDetails.alias }));
    return [...new Map(aliases.map(item => [item['value'], item])).values()];
  }, [receipts]);

  const uniqueTokensTo = useMemo(() => {
    const tokens = receipts.map(tx => ({ value: tx.swapDetails.tokenTo, label: tokenDetailsCache[tx.swapDetails.tokenTo]?.symbol || 'Unknown Symbol' }));
    return [...new Map(tokens.map(item => [item['value'], item])).values()];
  }, [receipts, tokenDetailsCache]);

  // Filtering logic
  const applyFilters = () => {
    const filtered = receipts.filter(tx => {
      const aliasMatch = selectedAlias.length === 0 || selectedAlias.find(alias => alias.value === tx.swapDetails.alias);
      const tokenToMatch = selectedTokenTo.length === 0 || selectedTokenTo.find(token => token.value === tx.swapDetails.tokenTo);
      return aliasMatch && tokenToMatch;
    });
    setFilteredReceipts(filtered);
  };

  // Use useEffect to initialize filteredReceipts with all receipts on component mount or when receipts change
  useEffect(() => {
    setFilteredReceipts(receipts);
  }, [receipts]);
  

  // if (!loadingStatus.transactions || !loadingStatus.decoding) {
  //   // return <div>Loading transactions and receipts...</div>;
  //   return <div><Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} /></div>;
  // }

  if (!loadingStatus.transactions || !loadingStatus.decoding || receipts.length === 0) {
    let alertMessage = '';
    if (!loadingStatus.transactions) {
      alertMessage = "Fetching transactions...";
    } else if (!loadingStatus.decoding) {
      alertMessage = "Decoding transactions and logs...";
    } else if (receipts.length === 0) {
      alertMessage = "No transactions available...";
    }       

    return (
      <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert variant="info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 'fit-content', padding: '20px' }}>
          <Spinner animation="border" style={{ marginBottom: '10px' }} />
          {alertMessage}
        </Alert>
      </div>
    );
  
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Render multi-select dropdowns for filtering */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <div style={{ width: '200px' }}>
          <Select
            options={uniqueAliases}
            onChange={setSelectedAlias}
            isMulti
            placeholder="Aliasses"
            styles={styleSelectBox}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> {/* Adjusted container for dropdown and button */}
          <div style={{ width: '150px' }}> {/* Reduced width for the dropdown */}
            <Select
              options={uniqueTokensTo}
              onChange={setSelectedTokenTo}
              isMulti
              placeholder="Tokens to"
              styles={styleSelectBox}
            />
          </div>
          {/* Place the Apply Filter button next to the dropdown */}
          <Button variant="success" onClick={applyFilters} style={{ marginTop: '0px' }}>Apply Filter</Button> {/* Removed the marginTop for alignment */}
        </div>
        {/* Input box for Slippage % */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Button variant="outline-secondary" onClick={handleSlippageModalShow}>
          <FiSettings />
        </Button>
        </div>

        <Modal show={showSlippageModal} onHide={handleSlippageModalClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>Set Slippage Tolerance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Slippage input form */}
            <Form>
              <Form.Group>
                <Form.Label>Slippage %</Form.Label>
                <Form.Control
                  type="number"
                  min="0.5"
                  step="0.1"
                  placeholder=">0.5"
                  value={slippage} // Ensure this variable is defined in your state
                  onChange={handleSlippageChange} // And this handler
                  onBlur={validateSlippage} // And also this one
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleSlippageModalClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSlippageModalClose}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
      {/* <div style={{ marginBottom: '20px' }}>
        <Button variant="success" onClick={applyFilters} style={{ marginTop: '10px' }}>Apply Filter</Button>
      </div> */}
      <Table striped bordered hover responsive>
        <thead>
            <tr>
                <th>Alias</th>
                <th>Token from</th>
                <th>Token to</th>
                <th>Amount from tokens</th>
                <th>Amount to tokens</th>
                {/* <th>Effective Swap Rate</th> */}
                {/* <th>Current Rate</th> */}
                <th>% rate change since swap</th>
                <th>Time Since swap</th>
                <th>Swap</th>
                <th>Transaction</th>
                {/* <th>Event Names</th> */}
            </tr>
        </thead>
        <tbody>
          {filteredReceipts.map((tx, index) => {
            // Retrieve symbols; fall back to 'Unknown Symbol' if not found
            const tokenFromSymbol = tokenDetailsCache[tx.swapDetails.tokenFrom]?.symbol || 'Unknown Symbol';
            const tokenToSymbol = tokenDetailsCache[tx.swapDetails.tokenTo]?.symbol || 'Unknown Symbol';
            const tokenToDecimals = tokenDetailsCache[tx.swapDetails.tokenTo]?.decimals.toString() || 'Unknown Decimals';

            // Construct Etherscan links for tokens
            const tokenFromEtherscanLink = `https://etherscan.io/token/${tx.swapDetails.tokenFrom}`;
            const tokenToEtherscanLink = `https://etherscan.io/token/${tx.swapDetails.tokenTo}`;
            const walletEtherscanLink = `https://etherscan.io/address/${tx.swapDetails.walletAddress}`;

            return (
              <tr key={index} >
                <td>
                  <a href={walletEtherscanLink} target="_blank" rel="noopener noreferrer">
                    {tx.swapDetails.alias}
                  </a>
                </td>
                {/* Render symbol as hyperlink to Etherscan */}
                <td>
                  <a href={tokenFromEtherscanLink} target="_blank" rel="noopener noreferrer">
                    {tokenFromSymbol}
                  </a>
                </td>
                {/* Render symbol as hyperlink to Etherscan */}
                <td style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a href={tokenToEtherscanLink} target="_blank" rel="noopener noreferrer">
                    {tokenToSymbol}
                  </a>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    style={{ marginLeft: 'auto' }} // Pushes the button to the right
                    onClick={() => addTokenToMetaMask(tx.swapDetails.tokenTo, tokenToSymbol, tokenToDecimals)}
                  >
                    <img src={metamaskLogo} alt="Add to MetaMask" style={{ width: '18px', height: '18px' }} />
                  </Button>
                </td>
                <td>{formatTokenAmount(tx.swapDetails.tokenFromAmount)}</td>
                <td>{formatTokenAmount(tx.swapDetails.tokenToAmount)}</td>
                {/* <td>{formatTokenAmount(tx.swapDetails.effectiveSwapRate)}</td> */}
                {/* <td>{formatTokenAmount(tx.swapDetails.currentRate)}</td> */}
                <td>{tx.swapDetails.percentageDifference}%</td>
                <td>{tx.swapDetails.timeSince}</td>
                <td>
                  <Form onSubmit={(e) => e.preventDefault()}>
                    <InputGroup>
                      <Form.Control 
                        type="number"
                        placeholder="Amount"
                        value={inputValues[tx.hash] || ''}
                        onChange={(e) => handleInputChange(tx.hash, e.target.value)}
                      />
                      <Button variant="success" onClick={() => handleSwap(tx)}>
                        Swap
                      </Button>
                    </InputGroup>
                  </Form>
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                    <img src={etherscanLogo} alt="Etherscan Logo" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                  </a>
                </td>
                {/* <td>{tx.hash}</td>  */}
                {/* <td>
                  {tx.swapDetails.decodedLogNames.join(", ")}
                </td> */}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default TransactionsTable;
