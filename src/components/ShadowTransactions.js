import axios from 'axios';
import { ethers } from 'ethers';
import React, { useState, useEffect, useMemo } from 'react';
import Table from 'react-bootstrap/Table';
// import Select from 'react-select';
import Button from 'react-bootstrap/Button';
// import { swapTokens } from './Swap2';
import { useSelector } from 'react-redux';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

import etherscanLogo from '../logo-etherscan.png';
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
    getTimeSince
} from '../helpers/helpers'




const etherscanApiKey = process.env.REACT_APP_etherscanApiKey
const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
const providerRPC = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);

// const POKT_APP_KEY = process.env.REACT_APP_POKT_APP_KEY;
// const providerRPC = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.rpc.grove.city/v1/${POKT_APP_KEY}`);

const address_Router = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const address_Factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

// let Count = 0;

const TransactionsTable = () => {

    const provider = useSelector(state => state.provider.connection)
    // const account = useSelector(state => state.provider.account)
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



    async function getTokenReserves(token0Address, token1Address, tokenFromDecimals, tokenToDecimals) {
    
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



    const [receipts, setReceipts] = useState([]);
    const [loadingStatus, setLoadingStatus] = useState({
        transactions: false,
        decoding: false,
        receipts: false,
    });

    // New state to track input values
    const [inputValues, setInputValues] = useState({});

    const handleInputChange = (hash, value) => {
        setInputValues(prev => ({ ...prev, [hash]: value }));
    };

    const handleCopy = (hash) => {
        console.log(inputValues[hash] || 'No amount entered');
    };

    const handleSwap = async (tx) => {
        // const path = tx.swapDetails.path;
        const amount = inputValues[tx.hash] || ''; // Get amount from inputValues state

        // Call swapTokens function with the required parameters
        await swapTokens(provider, tx.swapDetails.tokenFrom, tx.swapDetails.tokenTo, tx.swapDetails.decimalsFromToken, tx.swapDetails.decimalsToToken, amount);
    };

    useEffect(() => {
        const fetchTransactionsAndReceipts = async () => {

            setLoadingStatus({ transactions: false, decoding: false, receipts: false });
            const contractInterfaceRouter = new ethers.utils.Interface(UNISWAP_ROUTER_ABI);
            const contractInterface = new ethers.utils.Interface(UNISWAP_ABI);
            try {
                const currentBlock = await providerRPC.getBlockNumber();
                const blocksPerMonth = 4 * 60 * 24 * 30; // Approximation
                const startBlock = currentBlock - (3 * blocksPerMonth);

                const apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address_Router}&startblock=${startBlock}&endblock=${currentBlock}&sort=desc&apikey=${etherscanApiKey}`;

                const response = await axios.get(apiUrl);
                if (response.data.status === "1" && response.data.message === "OK") {
                    const transactions = response.data.result;

                    const filteredTransactions = transactions.filter(tx =>
                      shadowAddresses.some(addr => addr.walletAddress === tx.from.toLowerCase())
                    );

                    const transactionsWithDetails = await Promise.all(filteredTransactions.map(async tx => {
                        
                        const shadowAddressObj = shadowAddresses.find(addr => addr.walletAddress === tx.from.toLowerCase());

                        let decodedInputData = {};
                        try {
                            decodedInputData = contractInterfaceRouter.parseTransaction({ data: tx.input });
                        } catch (error) {
                            console.error('Error decoding transaction input:', tx.hash, error);
                        }

                        const receipt = await providerRPC.getTransactionReceipt(tx.hash);

                        // Filtering out failed transactions by checking receipt status
                        if (receipt.status === 0) {
                            console.log(`Skipping failed transaction with hash: ${tx.hash}`);
                            return null; // Skip adding this transaction to the results
                        }

                        let swapDetails = {
                            hash: tx.hash,
                            walletAddress: tx.from,
                            alias: shadowAddressObj ? shadowAddressObj.alias : 'Unknown', // Use the alias
                            path: undefined,
                            tokenFrom: undefined,
                            tokenTo: undefined,
                            tokenFromAmount: undefined,
                            tokenToAmount: undefined,
                            effectiveSwapRate: undefined,
                            currentRate: undefined,
                            percentageDifference: undefined,
                            decodedLogNames: [], // Placeholder for decoded logs,
                            decimalsToToken: undefined,
                            decimalsFromToken: undefined
                        };

                        if (decodedInputData && decodedInputData.args && decodedInputData.args.path) {
                            swapDetails.path = decodedInputData.args.path
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

                        const rate = await getTokenReserves(swapDetails.tokenFrom, swapDetails.tokenTo, decimalsFromToken, decimalsToToken).catch(console.error);


                        if (rate) {
                            // const rate = parseFloat(reserves.reserve0) / parseFloat(reserves.reserve1); // Adjust based on which token is token0 and token1 in the pair
                            swapDetails.currentRate = rate; // Store the rate with a fixed number of decimal places
                        }


                        let decodedLogs = []; // Array to store entire decoded logs

                        for (const log of receipt.logs) {
                            try {
                                
                                const decodedLog = contractInterface.parseLog({ topics: log.topics, data: log.data });
                                decodedLogs.push(decodedLog); // Push the entire decoded log
                                swapDetails.decodedLogNames.push(decodedLog.name); // Store only the event names

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
                    setLoadingStatus({ transactions: true, decoding: true, receipts: true });
                } else {
                    console.error('No transactions found or error fetching transactions:', response.data.result);
                }
            } catch (error) {
                console.error('Error fetching transactions or receipts:', error);
            }
        };

        fetchTransactionsAndReceipts();
    }, []);

    if (!loadingStatus.transactions || !loadingStatus.decoding || !loadingStatus.receipts) {
        return <div>Loading transactions and receipts...</div>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
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
                        <th>Swap amount</th>
                        <th>Copy</th>
                        <th>Transaction</th>
                        <th>Test</th>
                        {/* <th>Event Names</th> */}
                    </tr>
                </thead>
                <tbody>
                  {receipts.map((tx, index) => {
                    // Retrieve symbols; fall back to 'Unknown Symbol' if not found
                    const tokenFromSymbol = tokenDetailsCache[tx.swapDetails.tokenFrom]?.symbol || 'Unknown Symbol';
                    const tokenToSymbol = tokenDetailsCache[tx.swapDetails.tokenTo]?.symbol || 'Unknown Symbol';

                    // Construct Etherscan links for tokens
                    const tokenFromEtherscanLink = `https://etherscan.io/token/${tx.swapDetails.tokenFrom}`;
                    const tokenToEtherscanLink = `https://etherscan.io/token/${tx.swapDetails.tokenTo}`;
                    const walletEtherscanLink = `https://etherscan.io/address/${tx.swapDetails.walletAddress}`;

                    return (
                      <tr key={index}>
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
                        <td>
                          <a href={tokenToEtherscanLink} target="_blank" rel="noopener noreferrer">
                            {tokenToSymbol}
                          </a>
                        </td>
                        <td>{formatTokenAmount(tx.swapDetails.tokenFromAmount)}</td>
                        <td>{formatTokenAmount(tx.swapDetails.tokenToAmount)}</td>
                        {/* <td>{formatTokenAmount(tx.swapDetails.effectiveSwapRate)}</td> */}
                        {/* <td>{formatTokenAmount(tx.swapDetails.currentRate)}</td> */}
                        <td>{tx.swapDetails.percentageDifference}%</td>
                        <td>{tx.swapDetails.timeSince}</td>
                        <td>
                          <input
                              type="number"
                              placeholder="Input swap amount"
                              value={inputValues[tx.hash] || ''}
                              onChange={(e) => handleInputChange(tx.hash, e.target.value)}
                          />
                        </td>
                        <td>
                          <Button variant="primary" onClick={() => handleCopy(tx.hash)}>
                              Copy
                          </Button>
                           <Button variant="success" onClick={() => handleSwap(tx)}>Swap</Button>
                        </td>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                              <img src={etherscanLogo} alt="Etherscan Logo" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                          </a>
                        </td>
                        {/* <td>{tx.hash}</td>  */}


                        <td>
                          <Form onSubmit={(e) => e.preventDefault()}>
                            <InputGroup>
                              <Form.Control 
                                type="number"
                                placeholder="Input swap amount"
                                value={inputValues[tx.hash] || ''}
                                onChange={(e) => handleInputChange(tx.hash, e.target.value)}
                              />
                              {/* <Button variant="primary" onClick={() => handleCopy(tx.hash)}>
                                Copy
                              </Button>  */}
                              <Button variant="success" onClick={() => handleSwap(tx)}>
                                Swap
                              </Button>
                            </InputGroup>
                          </Form>
                        </td>


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
