import { ethers } from 'ethers';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useMemo } from 'react';
import Table from 'react-bootstrap/Table';
import Spinner from 'react-bootstrap/Spinner';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Select from 'react-select';
import { Modal } from 'react-bootstrap';
import { FiSettings } from 'react-icons/fi';
import { CheckCircleFill } from 'react-bootstrap-icons';

import etherscanLogo from '../media/logo-etherscan_transparant.png';
import metamaskLogo from '../media/logo_metamask.png';
import styleSelectBox from '../helpers/styling';

import { loadWallets} from '../localStorage';

import { addTransaction, updateTokensTransactions, clearShadowTransactions } from '../store/reducers/shadowTransactions';
import { 
  swapTokens
} from '../store/interactions'

import {
    formatTokenAmount,
    getTimeSince,
    addTokenToMetaMask
} from '../helpers/helpers'


import UNISWAP_ROUTER_ABI from '../abis/UniswapV2_Router.json';
import UNISWAP_ABI from '../abis/UniswapV2.json';
import UNISWAP_FACTORY_ABI from '../abis/UniswapV2_Factory.json';
import TOKEN_ABI from '../abis/Token.json'

const targetContractAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'.toLowerCase(); // The contract address you're interested in
const address_Factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
const etherscanApiKey = process.env.REACT_APP_etherscanApiKey;
const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;

const providerRPC2 = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
const providerRPC = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
const contractInterfaceRouter = new ethers.utils.Interface(UNISWAP_ROUTER_ABI);

const ShadowTransactions = () => {

  const account = useSelector(state => state.provider.account)
  const provider = useSelector(state => state.provider.connection)
  // console.log("TransactionsTable component mounted");
  const wallets =  loadWallets() || [];
  // const wallets = useSelector((state) => state.shadowAddresses) || [];
  // Now, the transactions table part
  const shadowTransactions = useSelector(state => state.shadowTransactions) || [];
  const sortedShadowTransactions = [...shadowTransactions].sort((a, b) => b.timestamp - a.timestamp);
  const [mainCompleted, setMainCompleted] = useState(false);


  //Loading states
  const [loadingStatus, setLoadingStatus] = useState({
    transactions: false
  });

  const [loadingStatusWallets, setLoadingStatusWallets] = useState(
    wallets.reduce((acc, wallet) => ({
      ...acc,
      [wallet.alias]: 'loading'
    }), {})
  );


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
  
  // Inside your component
  // const shadowTransactions = useSelector((state) => state.shadowTransactions) || [];

  const dispatch = useDispatch();

  // console.log(`test`, 'Test')

  async function formatTokenAmounts(amount, decimals) {
    // Convert the amounts to human-readable format
    const formattedAmount = ethers.utils.formatUnits(amount, decimals);    
    return formattedAmount
  }  

  // Refactored functions for decoding
  function decodeTransactionInput(data) {
      try {
          const decodedInput = contractInterfaceRouter.parseTransaction({ data });

          const tokens = { 
            tokenFrom: decodedInput.args.path[0], 
            tokenTo: decodedInput.args.path[1] 
          };

          console.log(`Decoded input:`, decodedInput);
          return tokens; // Return the decoded input
      } catch (error) {
          console.error(`Error decoding transaction input:`, error);
          return null;
      }
  }

  const tokenDetailsCache = {};

  async function getTokenDetails(tokenAddresses) {
    // console.time(getTokenDetails)
    const details = await Promise.all(tokenAddresses.map(async (address) => {
        // Check if the details for this address are already in the cache
        if (tokenDetailsCache[address]) {
          console.log(`Details from cache for ${address}:`, tokenDetailsCache[address]);
          return tokenDetailsCache[address];
        }
      
        const tokenContract = new ethers.Contract(address, TOKEN_ABI, providerRPC);
        try {
            const symbol = await tokenContract.symbol();
            const decimals = await tokenContract.decimals();
            const tokenDetails =  { address, symbol, decimals: decimals.toNumber() };

            // Update the cache with the new token details
            tokenDetailsCache[address] = tokenDetails;

            return tokenDetails;

        } catch (error) {
            console.error(`Error fetching token details for ${address}:`, error);
            return { address, symbol: null, decimals: null };
        }
    }));

    // console.timeEnd(getTokenDetails)
    
    console.log('firsttokenaddress: ',tokenAddresses[0])
    const {rate, pairAddress} = await getRate(tokenAddresses, details)
    console.log('rate: ', rate)

    return {
      tokenFromSymbol: details[0].symbol,
      tokenToSymbol: details[1].symbol,
      tokenFromDecimals: details[0].decimals,
      tokenToDecimals: details[1].decimals,
      currentRate: rate,
      liquidityPool: pairAddress
    }
  }

  async function decodeLogs(receipt, tokenDetails) {
    const contractInterface = new ethers.utils.Interface(UNISWAP_ABI);
    // Initialize accumulation variables
    let totalAmountTo = ethers.BigNumber.from('0');
    let totalAmountFrom = ethers.BigNumber.from('0');
  
    for (const log of receipt.logs) {
      try {
        // console.log('log:', log);
        const decodedLog = contractInterface.parseLog(log);
  
        if (decodedLog.name === "Swap") {
          console.log(`Decoded Swap event:`,receipt.transactionHash + '  -  ' +  decodedLog);

          console.log('amount0In', formatTokenAmounts(decodedLog.args.amount0In, tokenDetails.tokenToDecimals))
          console.log('amount1In', formatTokenAmounts(decodedLog.args.amount1In, tokenDetails.tokenToDecimals))
          console.log('amount0Out', formatTokenAmounts(decodedLog.args.amount0Out, tokenDetails.tokenFromDecimals))
          console.log('amount1Out', formatTokenAmounts(decodedLog.args.amount1Out, tokenDetails.tokenFromDecimals))
  
          // Determine the non-zero amounts
          if (decodedLog.args.amount0In == 0) {
            totalAmountFrom = totalAmountFrom.add(decodedLog.args.amount1In);
            totalAmountTo = totalAmountTo.add(decodedLog.args.amount0Out);
          } else {
            totalAmountFrom = totalAmountFrom.add(decodedLog.args.amount0In);
            totalAmountTo = totalAmountTo.add(decodedLog.args.amount1Out);
          }
  
          // Log the amounts for this particular Swap event
          console.log(`amount0In: ${decodedLog.args.amount0In.toString()}, amount1In: ${decodedLog.args.amount1In.toString()}, amount0Out: ${decodedLog.args.amount0Out.toString()}, amount1Out: ${decodedLog.args.amount1Out.toString()}`);
        }
      } catch (error) {
        console.error(`Error decoding log:`, error);
      }
    }
  
    // After accumulating, format the total amounts
    const tokenToAmount = await formatTokenAmounts(totalAmountTo.toString(), tokenDetails.tokenToDecimals);
    const tokenFromAmount = await formatTokenAmounts(totalAmountFrom.toString(), tokenDetails.tokenFromDecimals);
  
    // Calculate effective swap rate using the total amounts
    const effectiveSwapRate = parseFloat(tokenFromAmount) / parseFloat(tokenToAmount);
  
    // Return the aggregated amounts and the effective swap rate
    return { tokenToAmount, tokenFromAmount, effectiveSwapRate };
  }
  


  const rateCache = {};

  async function getRate(tokenAddresses, details) {
      // console.time(getRate);

      // Generate a unique key for the token pair to use in the cache
      const cacheKey = tokenAddresses.join('-');

      // Check if the rate for this token pair is already in the cache
      if (rateCache[cacheKey]) {
          console.log('Rate from cache:', rateCache[cacheKey]);
          return rateCache[cacheKey];
      }

      const factoryContract = new ethers.Contract(address_Factory, UNISWAP_FACTORY_ABI, providerRPC);
      const pairAddress = await factoryContract.getPair(tokenAddresses[0], tokenAddresses[1]);
      const pairContract = new ethers.Contract(pairAddress, UNISWAP_ABI, providerRPC);
      const reserves = await pairContract.getReserves();
      const token0 = await pairContract.token0();
      const token1 = await pairContract.token1();

      console.log('pairAddress ', pairAddress)

      let rate;
      let reserveFrom;
      let reserveTo;

      if (tokenAddresses[0] === token0) {
        reserveFrom = await formatTokenAmounts(reserves[0], details[0].decimals);
        reserveTo = await formatTokenAmounts(reserves[1], details[1].decimals);        
      } else if (tokenAddresses[0] === token1) {
        reserveTo = await formatTokenAmounts(reserves[0], details[1].decimals);
        reserveFrom = await formatTokenAmounts(reserves[1], details[0].decimals);
      }
      rate = reserveFrom / reserveTo;

      // Update the cache with the new rate
      rateCache[cacheKey] = rate;

      console.log('Calculated rate:', rate);
      // console.timeEnd(getRate);
      return {rate, pairAddress};
  }


  // Use this function to dispatch the initial transaction data
  function dispatchAddTransaction(transactionData) {
    // console.time(dispatchAddTransaction)
    // console.log(`shadowTransactions: `,shadowTransactions)
    // const existingTransaction = shadowTransactions.find(tx => tx.hash.toLowerCase() == transactionData.hash.toLowerCase());
    // if (!existingTransaction) {
      dispatch(addTransaction({
        hash: transactionData.hash,
        from: transactionData.from,
        alias: transactionData.alias, // Ensure you have logic to determine the alias based on the 'from' address
        tokenFrom: '', // Placeholder, to be updated
        tokenTo: '', // Placeholder, to be updated
        tokenFromSymbol: '',
        tokenToSymbol: '',
        tokenFromDecimals: '',
        tokenToDecimals: '',
        tokenFromAmount: '',
        tokenToAmount:'',
        effectiveSwapRate: '',
        currentRate: '',
        timestamp: transactionData.timestamp,
        liquidityPool: ''
      }));
    // } else {
    //   console.log(`Transaction ${transactionData.hash} already exists in the store.`);
    // }
    // console.timeEnd(dispatchAddTransaction)
  }

  // Use this function to dispatch updates to a transaction (e.g., decoded input data)
  function dispatchTokensTransactions(dispatch, hash, updates) {
    // console.time(dispatchTokensTransactions)
    dispatch(updateTokensTransactions({
      hash,
      updates, // This object should contain the keys and values to update, e.g., { tokenFrom: '...', tokenTo: '...' }
    }));
    // console.timeEnd(dispatchTokensTransactions)
  }

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
        tx.tokenFrom, 
        tx.tokenTo, 
        tx.tokenFromDecimals, 
        tx.tokenToDecimals, 
        amount
        ,slippage
      );

      // Clear the input field after successful swap
      setInputValues(prev => ({ ...prev, [tx.hash]: '' }));
    } else {
      window.alert("Please connect your account");
    }
  };


  async function fetchAndDecodeTransactions(walletAddress, walletAlias, startBlock, endBlock) {
    // console.time('fetchAndDecodeTransactions');
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${etherscanApiKey}`;
    
    try {
        const response = await axios.get(url);
        const data = response.data; // Use `response.data` to access the response content
        if (data.status === '1') {
            console.log(`Transactions for address ${walletAddress}:`);
            // Filter transactions for the target contract address
            const filteredTransactions = data.result.filter(tx => tx.to.toLowerCase() === targetContractAddress);
            console.log('filteredtransactions: ', filteredTransactions);


            // Function to chunk the array into smaller arrays of a specified size
            const chunkArray = (array, size) => {
                var results = [];
                while (array.length) {
                    results.push(array.splice(0, size));
                }
                return results;
            };

            // Chunking filteredTransactions into chunks of 9
            const transactionChunks = chunkArray(filteredTransactions, 9);

            // Processing each chunk with a delay of 2 seconds between each
            for (const chunk of transactionChunks) {
                await Promise.all(chunk.map(async (tx) => {
                    // console.log(`Transaction to target contract: ${tx.hash}`);
                    if (tx.to.toLowerCase() === targetContractAddress) {
                        const receipt = await providerRPC.getTransactionReceipt(tx.hash);
                        // console.log('timeStamp: ', tx.timeStamp);
                        dispatchAddTransaction({ 
                            hash: tx.hash,
                            timestamp: tx.timeStamp,
                            from: walletAddress, 
                            alias: walletAlias
                        });

                        const tokens = decodeTransactionInput(tx.input);
                        dispatchTokensTransactions(dispatch, tx.hash, tokens);

                        const tokenDetails = await getTokenDetails([tokens.tokenFrom, tokens.tokenTo]);
                        dispatchTokensTransactions(dispatch, tx.hash, tokenDetails);

                        const amounts = await decodeLogs(receipt, tokenDetails);
                        dispatchTokensTransactions(dispatch, tx.hash, amounts);
                    }

                }));

                // Wait for 2 seconds before processing the next chunk
                await new Promise(resolve => setTimeout(resolve, 1100));


                
            }
        
        } else {
            console.error(`Error fetching transactions for address ${walletAddress}: ${data.message}`);
        }
    } catch (error) {
        console.error(`Error fetching transactions:`, error);
    }
    // console.timeEnd('fetchAndDecodeTransactions');
}



  // async function listenForNewTransactions() {
  //     providerRPC.on('block', async (blockNumber) => {
  //         const block = await providerRPC.getBlockWithTransactions(blockNumber);
  //         for (const transaction of block.transactions) {
  //             if (wallets.map(w => w.walletAddress.toLowerCase()).includes(transaction.from.toLowerCase()) && transaction.to.toLowerCase() === targetContractAddress) {
  //                 console.log(`New transaction from watched address to target contract in block ${blockNumber}`);

  //                 // Decode transaction input
  //                 await decodeTransactionInput(transaction.data);

  //                 // Wait for confirmation and fetch logs
  //                 const receipt = await providerRPC.waitForTransaction(transaction.hash);
  //                 await decodeLogs(receipt);
  //             }
  //         }
  //     });
  // }

  async function main() {
      console.time(main)
      // console.log(`test2: `, "TEST2")
      const currentBlock = await providerRPC.getBlockNumber();
      const blocksPerMonth = 4 * 60 * 24 ; // Approximation for blocks in a day
      const startBlock = currentBlock - (30 * blocksPerMonth);

      console.log(`Fetching and decoding historical transactions from about 3 months ago`);

      //Look for transactions from these wallets to Uniswap V2 router
      //Decode this transaction to derive TokenFrom and TokenTo
      //Decode the decimals from the TokenFrom and TokenTo contract
      //Decode the amounts swapped from the transaction receipts (needs decimmls)
      dispatch(clearShadowTransactions());
      console.log('wallets: ', wallets)
      for (const wallet of wallets) {
          await fetchAndDecodeTransactions(wallet.walletAddress, wallet.alias, startBlock, currentBlock);
          setLoadingStatusWallets(prevStatus => ({ ...prevStatus, [wallet.alias]: 'loaded' }));
      }

      // setFilteredReceipts(sortedShadowTransactions);
      // applyFilters()
      setFilteredReceipts(sortedShadowTransactions)
      setLoadingStatus({ transactions: true });

      console.timeEnd(main)
      // listenForNewTransactions();
      setMainCompleted(true);
  }

  useEffect(() => {
    main()
      .catch(console.error)
      // .then(() => {
      //   applyFilters();
      // })
      ;
    // console.log('TEST: ', shadowTransactions)
  }, []); // Ensure main is only called once on component mount

  useEffect(() => {
    if (mainCompleted) {
        applyFilters();
        setMainCompleted(false); // Reset if you expect main to run again in the future
    }
  }, [mainCompleted]); // This useEffect depends on mainCompleted.

  // useEffect(() => {
  //   applyFilters();
  // }, [sortedShadowTransactions, selectedAlias, selectedTokenTo]);
  // // const percentageDifference = ((parseFloat(tx.currentRate) - parseFloat(tx.effectiveSwapRate)) / parseFloat(tx.effectiveSwapRate)) * 100;

  // Extract unique values for Alias and Token to dropdowns
  const uniqueAliases = useMemo(() => {
    const aliases = sortedShadowTransactions.map(tx => ({ value: tx.alias, label: tx.alias }));
    return [...new Map(aliases.map(item => [item['value'], item])).values()];
  }, [sortedShadowTransactions]);

  const uniqueTokensTo = useMemo(() => {
    const tokens = sortedShadowTransactions.map(tx => ({ value: tx.tokenTo, label: tx.tokenToSymbol }));
    return [...new Map(tokens.map(item => [item['value'], item])).values()];
  }, [sortedShadowTransactions]);

  // Filtering logic
  const applyFilters = () => {
    const filtered = sortedShadowTransactions.filter(tx => {
      const aliasMatch = selectedAlias.length === 0 || selectedAlias.find(alias => alias.value === tx.alias);
      const tokenToMatch = selectedTokenTo.length === 0 || selectedTokenTo.find(token => token.value === tx.tokenTo);
      return aliasMatch && tokenToMatch;
    });
    setFilteredReceipts(filtered);
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

  return (
      <>
      {!loadingStatus.transactions ? (
        <div style={{ height: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {wallets.map(wallet => (
          <div key={wallet.walletAddress} style={{ margin: '10px 0' }}>
            <Alert variant="info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 'fit-content', padding: '20px', maxWidth: '400px' }}>
              <span>{wallet.alias || wallet.walletAddress}</span>
              {loadingStatusWallets[wallet.alias] === 'loading' ? (
                <Spinner animation="border" />
              ) : (
                  <CheckCircleFill style={{ color: 'green', fontSize: '1.5rem' }} />
              )}
            </Alert>
          </div>
        ))}
        </div>
      ) : (     
        <div style={{ overflowX: 'auto' }}>
        {/* Render multi-select dropdowns for filtering */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
            <div style={{ width: '250px' }}>
              <Select
                options={uniqueAliases}
                onChange={setSelectedAlias}
                isMulti
                placeholder="Aliasses"
                styles={styleSelectBox}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> {/* Adjusted container for dropdown and button */}
              <div style={{ width: '250px' }}> {/* Reduced width for the dropdown */}
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
        {/* // This will be displayed once loadingStatus.transactions is true */}
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Alias</th>
              <th>Token From</th>
              <th>Token To</th>
              <th>Token From Amount</th>
              <th>Token To Amount</th>
              <th>% rate change since swap</th>
              <th>Time Since swap</th>
              <th>Swap</th>
              <th>Transaction</th>
              <th>Liquidity pool</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map((tx, index) => (
              <tr key={tx.hash}>
                <td>{index + 1}</td>
                <td>
                  <a href={`https://etherscan.io/address/${tx.from}`} target="_blank" rel="noopener noreferrer">
                    {tx.alias}
                  </a>
                </td>
                <td>
                  <a href={`https://etherscan.io/token/${tx.tokenFrom}`} target="_blank" rel="noopener noreferrer">
                    {tx.tokenFromSymbol}
                  </a>
                </td>
                <td style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a href={`https://etherscan.io/token/${tx.tokenTo}`} target="_blank" rel="noopener noreferrer">
                    {tx.tokenToSymbol}
                  </a>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    style={{ marginLeft: 'auto' }} // Pushes the button to the right
                    onClick={() => addTokenToMetaMask(tx.tokenTo, tx.tokenToSymbol, tx.tokenToDecimals)}
                  >
                    <img src={metamaskLogo} alt="Add to MetaMask" style={{ width: '18px', height: '18px' }} />
                  </Button>
                </td>               
                <td>{formatTokenAmount(tx.tokenFromAmount)}</td>
                <td>{formatTokenAmount(tx.tokenToAmount)}</td>
                <td>{(((parseFloat(tx.currentRate) - parseFloat(tx.effectiveSwapRate)) / parseFloat(tx.effectiveSwapRate)) * 100).toFixed(2)}</td>
                <td>{getTimeSince(tx.timestamp)}</td>
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
                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <a href={`https://etherscan.io/address/${tx.liquidityPool}`} target="_blank" rel="noopener noreferrer">
                    <img src={etherscanLogo} alt="Etherscan Logo" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        </div>
      )}
    </>
  );
  
};

export default ShadowTransactions;
