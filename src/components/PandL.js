	// import axios from 'axios';
// import { ethers } from 'ethers';
// import React, { useState, useEffect, useMemo } from 'react';
// import Table from 'react-bootstrap/Table';
// import Select from 'react-select';
// import Button from 'react-bootstrap/Button';
// import { useSelector } from 'react-redux';

// import etherscanLogo from '../logo-etherscan.png';
// import UNISWAP_ROUTER_ABI from '../abis/UniswapV2_Router.json';
// import UNISWAP_ABI from '../abis/UniswapV2.json';
// import UNISWAP_FACTORY_ABI from '../abis/UniswapV2_Factory.json';
// const tokenABI = [
//   "function decimals() view returns (uint8)"
// ];

// // require('dotenv').config();

// const etherscanApiKey = process.env.REACT_APP_etherscanApiKey
// const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
// // const POKT_APP_KEY = process.env.REACT_APP_POKT_APP_KEY;
// // console.log(POKT_APP_KEY)
// const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
// // const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.rpc.grove.city/v1/${POKT_APP_KEY}`);

// const address_Router = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
// const address_Factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

// let Count = 0;

const TransactionsTable = () => {

//     const factoryContract = new ethers.Contract(address_Factory, UNISWAP_FACTORY_ABI, provider);
//     console.log('factoryContract111:', factoryContract)

//     const decimalsCache = useMemo(() => ({}), []);

//     function formatTokenAmount(amount) {
//         const num = parseFloat(amount);
//         if (isNaN(num)) return '0'; // Return '0' if the amount is not a number

//         // Use Intl.NumberFormat for thousand separators and conditional decimals
//         const formatter = new Intl.NumberFormat('en-US', {
//             minimumFractionDigits: num < 1 ? 6 : (num >= 1 && num < 1000) ? 2 : 0,
//             maximumFractionDigits: num < 1 ? 6 : (num >= 1 && num < 1000) ? 2 : 0,
//         });
        
//         return formatter.format(num);
//     }


//     async function getOrFetchTokenDecimals(tokenAddress) {
//         if (!decimalsCache[tokenAddress]) {
//             const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
//             decimalsCache[tokenAddress] = await tokenContract.decimals();
//         }
//         return decimalsCache[tokenAddress];
//     }

//     async function getTokenDecimals(tokenAddress) {
//       // Connect to the token contract
//       const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
      
//       // Call the decimals function
//       const decimals = await tokenContract.decimals();
//       // console.log(`Token decimals: ${decimals}`);
      
//       return decimals;
//     }

//     function getTimeSince(timestamp) {
//         const now = new Date(); // Current time
//         const txDate = new Date(timestamp * 1000); // Convert Unix epoch time to JavaScript Date object
//         const diff = now - txDate; // Difference in milliseconds

//         const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//         const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//         const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

//         return `${days} D, ${hours} H, ${minutes} M`;
//     }

//     async function getTokenReserves(token0Address, token1Address, tokenFromDecimals, tokenToDecimals) {
//         // Here you would find the pair address for tokenA and tokenB
//         // For this example, let's assume you have the pairAddress already
//         // console.log('factoryContract:', factoryContract)
//         // Count++;
//         // console.log('Count:', Count);

    
//         const pairAddress = await factoryContract.getPair(token0Address, token1Address);

//         console.log('pairAddress:', pairAddress)

//         // const pairAddress = await factoryContract.getPair(tokenAAddress, tokenBAddress)
//         const pairContract = new ethers.Contract(pairAddress, UNISWAP_ABI, provider);
//         const reserves = await pairContract.getReserves();
//         const token0 = await pairContract.token0();
//         const token1 = await pairContract.token1();

//         console.log('Test:', ethers.utils.formatUnits(reserves[0], tokenFromDecimals) / ethers.utils.formatUnits(reserves[1], tokenToDecimals))

//         let rate1;
//         if (token0Address === token0) {
//             rate1 = parseFloat(ethers.utils.formatUnits(reserves[0], tokenFromDecimals)) / parseFloat(ethers.utils.formatUnits(reserves[1], tokenToDecimals))
//         } else if (token0Address === token1) {
//             rate1 = parseFloat(ethers.utils.formatUnits(reserves[1], tokenFromDecimals)) / parseFloat(ethers.utils.formatUnits(reserves[0], tokenToDecimals))
//         }

//         console.log('rate1:', rate1)


//         console.log('Reserves:', reserves)
//         console.log('token0:', token0)
//         console.log('token1:', token1)

//         return rate1;
//     }


//     const shadows = useSelector((state) => state.shadowSlice) || [];
//     // console.log(shadows)



//     // Extract all shadowAddresses into a separate array and convert them to lowercase
//     const shadowAddresses = shadows
//       .filter(shadow => shadow.walletAddress !== undefined) // Keep only items with walletAddress
//       .map(shadow => ({
//         walletAddress: shadow.walletAddress.toLowerCase(),
//         alias: shadow.alias // Include the alias
//     }));

//     // console.log(shadowAddresses); // This will show all extracted and filtered shadowAddresses, all in lowercase    


//     const [receipts, setReceipts] = useState([]);
//     const [loadingStatus, setLoadingStatus] = useState({
//         transactions: false,
//         decoding: false,
//         receipts: false,
//     });

//     // New state to track input values
//     const [inputValues, setInputValues] = useState({});

//     const handleInputChange = (hash, value) => {
//         setInputValues(prev => ({ ...prev, [hash]: value }));
//     };

//     const handleCopy = (hash) => {
//         console.log(inputValues[hash] || 'No amount entered');
//         // Additional logic to copy to clipboard if needed
//     };

//     useEffect(() => {
//         const fetchTransactionsAndReceipts = async () => {

//             setLoadingStatus({ transactions: false, decoding: false, receipts: false });
//             const contractInterfaceRouter = new ethers.utils.Interface(UNISWAP_ROUTER_ABI);
//             const contractInterface = new ethers.utils.Interface(UNISWAP_ABI);
//             try {
//                 const currentBlock = await provider.getBlockNumber();
//                 const blocksPerMonth = 4 * 60 * 24 * 30; // Approximation
//                 const startBlock = currentBlock - (3 * blocksPerMonth);

//                 const apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address_Router}&startblock=${startBlock}&endblock=${currentBlock}&sort=desc&apikey=${etherscanApiKey}`;

//                 const response = await axios.get(apiUrl);
//                 if (response.data.status === "1" && response.data.message === "OK") {
//                     const transactions = response.data.result;
//                     // console.log('Transactions:', transactions);

//                     const filteredTransactions = transactions.filter(tx =>
//                       shadowAddresses.some(addr => addr.walletAddress === tx.from.toLowerCase())
//                     );
//                     // console.log('Filtered ransactions:', filteredTransactions);

//                     const transactionsWithDetails = await Promise.all(filteredTransactions.map(async tx => {
                        
//                         const shadowAddressObj = shadowAddresses.find(addr => addr.walletAddress === tx.from.toLowerCase());

//                         let decodedInputData = {};
//                         try {
//                             decodedInputData = contractInterfaceRouter.parseTransaction({ data: tx.input });
//                         } catch (error) {
//                             console.error('Error decoding transaction input:', tx.hash, error);
//                         }

//                         const receipt = await provider.getTransactionReceipt(tx.hash);

//                         // Filtering out failed transactions by checking receipt status
//                         if (receipt.status === 0) {
//                             console.log(`Skipping failed transaction with hash: ${tx.hash}`);
//                             return null; // Skip adding this transaction to the results
//                         }

//                         let swapDetails = {
//                             hash: tx.hash,
//                             walletAddress: tx.from,
//                             alias: shadowAddressObj ? shadowAddressObj.alias : 'Unknown', // Use the alias
//                             tokenFrom: undefined,
//                             tokenTo: undefined,
//                             tokenFromAmount: undefined,
//                             tokenToAmount: undefined,
//                             effectiveSwapRate: undefined,
//                             currentRate: undefined,
//                             percentageDifference: undefined,
//                             decodedLogNames: [] // Placeholder for decoded logs
//                         };

//                         if (decodedInputData && decodedInputData.args && decodedInputData.args.path) {
//                             swapDetails.tokenFrom = decodedInputData.args.path[0];
//                             swapDetails.tokenTo = decodedInputData.args.path.length > 1 ? decodedInputData.args.path[1] : undefined;
//                         }

//                         const decimalsFromToken = await getOrFetchTokenDecimals(swapDetails.tokenFrom).catch(console.error);
//                         const decimalsToToken = await getOrFetchTokenDecimals(swapDetails.tokenTo).catch(console.error);

//                         const timeSince = getTimeSince(tx.timeStamp); // Assuming tx.timeStamp is the Unix timestamp of the transaction
//                         swapDetails.timeSince = timeSince;

//                         console.log('tokenFrom:', swapDetails.tokenFrom);
//                         console.log('tokenTo:', swapDetails.tokenTo);

//                         const rate = await getTokenReserves(swapDetails.tokenFrom, swapDetails.tokenTo, decimalsFromToken, decimalsToToken).catch(console.error);


//                         if (rate) {
//                             // const rate = parseFloat(reserves.reserve0) / parseFloat(reserves.reserve1); // Adjust based on which token is token0 and token1 in the pair
//                             swapDetails.currentRate = rate; // Store the rate with a fixed number of decimal places
//                         }


//                         let decodedLogs = []; // Array to store entire decoded logs

//                         for (const log of receipt.logs) {
//                             try {
                                
//                                 const decodedLog = contractInterface.parseLog({ topics: log.topics, data: log.data });
//                                 decodedLogs.push(decodedLog); // Push the entire decoded log
//                                 // console.log('Event Name:', decodedLog.name);
//                                 // console.log('Decoded Arguments:', decodedLog.args);
//                                 swapDetails.decodedLogNames.push(decodedLog.name); // Store only the event names
//                                 // console.log('decodedLog:', decodedLog)

//                                 // console.log('Tokenfrom:', swapDetails.tokenFrom)
//                                 // console.log('Tokento:', swapDetails.tokenTo)
//                                 // console.log('Decomalsfrom:', decimalsFromToken)

//                                 // let tokenFromAmount ;
//                                 // let tokenToAmount ;

//                                 if (decodedLog.name === "Swap") {
//                                     const amount1 = ethers.utils.formatUnits(decodedLog.args[1], decimalsFromToken);
//                                     const amount2 = ethers.utils.formatUnits(decodedLog.args[2], decimalsFromToken);
//                                     const amount3 = ethers.utils.formatUnits(decodedLog.args[3], decimalsToToken);
//                                     const amount4 = ethers.utils.formatUnits(decodedLog.args[4], decimalsToToken);

//                                     if(amount4 == 0.0) {
//                                         swapDetails.tokenFromAmount = amount2
//                                         swapDetails.tokenToAmount = amount3
//                                     } else {
//                                         swapDetails.tokenFromAmount = amount1
//                                         swapDetails.tokenToAmount = amount4
//                                     }

//                                     // Calculate the effective swap rate, ensuring not to divide by zero
//                                     const effectiveSwapRate = swapDetails.tokenToAmount && swapDetails.tokenToAmount !== '0' 
//                                         ? parseFloat(swapDetails.tokenFromAmount) / parseFloat(swapDetails.tokenToAmount) 
//                                         : 0; // You might want to handle this case more gracefully

//                                     // Add the effectiveSwapRate to swapDetails
//                                     swapDetails.effectiveSwapRate = effectiveSwapRate; // Limiting the decimal places for display

//                                     // console.log('amount1:', amount1);                         
//                                     // console.log('amount2:', amount2);                         
//                                     // console.log('amount3:', amount3);                         
//                                     // console.log('amount4:', amount4);  
//                                     // console.log('tokenFromAmount:', swapDetails.tokenFromAmount);  
//                                     // console.log('tokenToAmount:', swapDetails.tokenToAmount);  
                                                           
//                                 }

//                             } catch (error) {
//                                 // This catch block will handle errors for logs that don't match the ABI
//                             }
//                         };

//                         if (swapDetails.currentRate && swapDetails.effectiveSwapRate) {
//                             // Calculate the percentage difference
//                             const percentageDifference = ((parseFloat(swapDetails.currentRate) - parseFloat(swapDetails.effectiveSwapRate)) / parseFloat(swapDetails.effectiveSwapRate)) * 100;

//                             // Store the percentage difference in the swapDetails object, formatted to 2 decimal places
//                             swapDetails.percentageDifference = percentageDifference.toFixed(2);
//                         }


//                         return { ...tx, decodedInputData, receipt, swapDetails, decodedLogs };
//                     }));

//                     const validTransactions = transactionsWithDetails.filter(tx => tx && tx.swapDetails.tokenFrom && tx.swapDetails.tokenTo);
//                     console.log('Transactions with Receipts:', validTransactions);
//                     setReceipts(validTransactions);
//                     setLoadingStatus({ transactions: true, decoding: true, receipts: true });
//                 } else {
//                     console.error('No transactions found or error fetching transactions:', response.data.result);
//                 }
//             } catch (error) {
//                 console.error('Error fetching transactions or receipts:', error);
//             }
//         };

//         fetchTransactionsAndReceipts();
//     }, []);

//     if (!loadingStatus.transactions || !loadingStatus.decoding || !loadingStatus.receipts) {
//         return <div>Loading transactions and receipts...</div>;
//     }

//     return (
//         <div style={{ overflowX: 'auto' }}>
//             <Table striped bordered hover responsive>
//                 <thead>
//                     <tr>
//                         <th>Alias</th>
//                         <th>Token from</th>
//                         <th>Token to</th>
//                         <th>Amount from tokens</th>
//                         <th>Amount to tokens</th>
//                         <th>Effective Swap Rate</th>
//                         <th>Current Rate</th>
//                         <th>% rate Difference</th>
//                         <th>Time Since</th>
//                         <th>Swap amount</th>
//                         <th>Copy</th>
//                         <th>Etherscan</th>
//                         <th>Event Names</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {receipts.map((tx, index) => (
//                         <tr key={index}>
//                             <td>{tx.swapDetails.alias}</td>
//                             <td>{tx.swapDetails.tokenFrom}</td>
//                             <td>{tx.swapDetails.tokenTo}</td>
//                             <td>{formatTokenAmount(tx.swapDetails.tokenFromAmount)}</td>
//                             <td>{formatTokenAmount(tx.swapDetails.tokenToAmount)}</td>
//                             <td>{formatTokenAmount(tx.swapDetails.effectiveSwapRate)}</td>
//                             <td>{formatTokenAmount(tx.swapDetails.currentRate)}</td>
//                             <td>{tx.swapDetails.percentageDifference}%</td>
//                             <td>{tx.swapDetails.timeSince}</td>
//                             <td>
//                                 <input
//                                     type="number"
//                                     placeholder="Input swap amount"
//                                     value={inputValues[tx.hash] || ''}
//                                     onChange={(e) => handleInputChange(tx.hash, e.target.value)}
//                                 />
//                             </td>
//                             <td>
//                                 <Button variant="primary" onClick={() => handleCopy(tx.hash)}>
//                                     Copy
//                                 </Button>
//                             </td>
//                             <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
//                                 <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
//                                     <img src={etherscanLogo} alt="Etherscan Logo" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
//                                 </a>
//                             </td>
//                             <td>
//                                 {tx.swapDetails.decodedLogNames.join(", ")}
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </Table>
//         </div>
//     );
};

export default TransactionsTable;
