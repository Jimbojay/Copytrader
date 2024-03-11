import { ethers } from 'ethers';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';

import UNISWAP_ROUTER_ABI from '../abis/UniswapV2_Router.json';
// import UNISWAP_ABI from '../abis/UniswapV2.json';
// import UNISWAP_FACTORY_ABI from '../abis/UniswapV2_Factory.json';
// import TOKEN_ABI from '../abis/Token.json'

const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;


const targetContractAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'.toLowerCase(); // The contract address you're interested in
const etherscanApiKey = process.env.REACT_APP_etherscanApiKey;
const providerRPC = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);

const contractInterfaceRouter = new ethers.utils.Interface(UNISWAP_ROUTER_ABI);


const TransactionsTable = () => {
  // const wallets = useSelector((state) => state.shadowAddresses) || [];
  // const dispatch = useDispatch();


  // // Refactored functions for decoding
  // async function decodeTransactionInput(data) {
  //     try {
  //         const decodedInput = contractInterfaceRouter.parseTransaction({ data });
  //         console.log(`Decoded input:`, decodedInput);
  //     } catch (error) {
  //         console.error(`Error decoding transaction input:`, error);
  //     }
  // }

  // async function decodeLogs(receipt) {
  //     receipt.logs.forEach(log => {
  //         try {
  //             const decodedLog = contractInterfaceRouter.parseLog({ topics: log.topics, data: log.data });
  //             console.log(`Decoded log:`, decodedLog);
  //         } catch (error) {
  //             console.error(`Error decoding log:`, error);
  //         }
  //     });
  // }

  // // Use this function to dispatch the initial transaction data
  // function dispatchAddTransaction(transactionData) {
  //   dispatch(addTransaction({
  //     hash: transactionData.hash,
  //     from: transactionData.from,
  //     alias: transactionData.alias, // Ensure you have logic to determine the alias based on the 'from' address
  //     tokenFrom: '', // Placeholder, to be updated
  //     tokenTo: '', // Placeholder, to be updated
  //   }));
  // }

  // // Use this function to dispatch updates to a transaction (e.g., decoded input data)
  // function dispatchUpdateTransaction(hash, updates) {
  //   dispatch(updateTransaction({
  //     hash,
  //     updates, // This object should contain the keys and values to update, e.g., { tokenFrom: '...', tokenTo: '...' }
  //   }));
  // }

  // async function fetchAndDecodeTransactions(walletAddress, startBlock, endBlock) {
  //     const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${etherscanApiKey}`;
  //     const response = await axios.get(url);
  //     const data = await response.json();
  //     if (data.status === '1') {
  //         console.log(`Transactions for address ${walletAddress}:`);
  //         for (const tx of data.result) {
  //             // Filter transactions by the target contract address
  //             if (tx.to.toLowerCase() === targetContractAddress) {
  //                 console.log(`Transaction to target contract: ${tx.hash}`);

  //                 // Decode transaction input
  //                 await decodeTransactionInput(tx.input);

  //                 // Fetch and decode logs
  //                 const receipt = await providerRPC.getTransactionReceipt(tx.hash);
  //                 await decodeLogs(receipt);
  //             }
  //         }
  //     } else {
  //         console.error(`Error fetching transactions for address ${walletAddress}: ${data.message}`);
  //     }
  // }

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

  // async function main() {
  //     const currentBlock = await providerRPC.getBlockNumber();
  //     const blocksPerMonth = 4 * 60 * 24 * 30; // Approximation for blocks in a month
  //     const startBlock = currentBlock - (3 * blocksPerMonth); // Start block for roughly 3 months ago

  //     console.log(`Fetching and decoding historical transactions from about 3 months ago`);

  //     for (const wallet of wallets) {
  //         await fetchAndDecodeTransactions(wallet.walletAddress, startBlock, currentBlock);
  //     }

  //     listenForNewTransactions();
  // }

  // main().catch(console.error);

};

export default TransactionsTable;
