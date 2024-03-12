import { ethers } from 'ethers';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';

import { addTransaction, updateTokensTransactions } from '../store/reducers/shadowTransactions';

import UNISWAP_ROUTER_ABI from '../abis/UniswapV2_Router.json';
import UNISWAP_ABI from '../abis/UniswapV2.json';
// import UNISWAP_FACTORY_ABI from '../abis/UniswapV2_Factory.json';
import TOKEN_ABI from '../abis/Token.json'

const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;


const targetContractAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'.toLowerCase(); // The contract address you're interested in
const etherscanApiKey = process.env.REACT_APP_etherscanApiKey;
const providerRPC = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
// const providerRPC = new ethers.providers.Web3Provider(window.ethereum);
// console.log(providerRPC)

const contractInterfaceRouter = new ethers.utils.Interface(UNISWAP_ROUTER_ABI);

const ShadowTransactions = () => {

  // console.log("TransactionsTable component mounted");
  const wallets = useSelector((state) => state.shadowAddresses) || [];
  // Inside your component
  // const shadowTransactions = useSelector((state) => state.shadowTransactions) || [];

  const dispatch = useDispatch();

  // console.log(`test`, 'Test')

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

  async function getTokenDetails(tokenAddresses) {
    const details = await Promise.all(tokenAddresses.map(async (address) => {
        const tokenContract = new ethers.Contract(address, TOKEN_ABI, providerRPC);
        try {
            const symbol = await tokenContract.symbol();
            const decimals = await tokenContract.decimals();
            return { address, symbol, decimals: decimals.toNumber() };
        } catch (error) {
            console.error(`Error fetching token details for ${address}:`, error);
            return { address, symbol: null, decimals: null };
        }
    }));
    return {
      tokenFromSymbol: details[0].symbol,
      tokenToSymbol: details[1].symbol,
      tokenFromDecimals: details[0].decimals,
      tokenToDecimals: details[1].decimals,
    }
  }

  async function decodeLogs(receipt) {
    const contractInterface = new ethers.utils.Interface(UNISWAP_ABI);
    for (const log of receipt.logs) {
      try {
        // Decode the log with the contract interface
        const decodedLog = contractInterface.parseLog(log);
        
        // Check if the log is a "Swap" event
        if (decodedLog.name === "Swap") {

          console.log(`amount0In: ${decodedLog.args.amount0In.toString()}`);
          console.log(`amount1In: ${decodedLog.args.amount1In.toString()}`);
          console.log(`amount0Out: ${decodedLog.args.amount0Out.toString()}`);
          console.log(`amount1Out: ${decodedLog.args.amount1Out.toString()}`);

          // Initialize variables to hold the non-zero amounts
          let amountIn = '0';
          let amountOut = '0';
            
          // Determine the non-zero amounts
          if (!decodedLog.args.amount0In.toString() === 0) {
            amountIn = decodedLog.args.amount0In.toString();
            amountOut = decodedLog.args.amount1Out.toString()
          } else  {
            amountIn = decodedLog.args.amount1In.toString();
            amountOut = decodedLog.args.amount0Out.toString()
          }

          // Return the non-zero amounts as amountIn and amountOut
          return { amountIn, amountOut };
        }
      } catch (error) {
        console.error(`Error decoding log:`, error);
      }
    }
  
    // Return null or an appropriate default value if no Swap event is found
    return null;
  }

  async function formatTokenAmounts(amounts, tokenDetails) {
    // Convert the amounts to human-readable format
    const tokenToAmount = ethers.utils.formatUnits(amounts.amountOut, tokenDetails.tokenToDecimals);
    const tokenFromAmount = ethers.utils.formatUnits(amounts.amountIn, tokenDetails.tokenFromDecimals);
  
    return {
      tokenToAmount: tokenToAmount,
      tokenFromAmount: tokenFromAmount,
    };
  }  

  // Use this function to dispatch the initial transaction data
  function dispatchAddTransaction(transactionData) {
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
        currentRate: ''
      }));
    // } else {
    //   console.log(`Transaction ${transactionData.hash} already exists in the store.`);
    // }
  }

  // Use this function to dispatch updates to a transaction (e.g., decoded input data)
  function dispatchTokensTransactions(dispatch, hash, updates) {
    dispatch(updateTokensTransactions({
      hash,
      updates, // This object should contain the keys and values to update, e.g., { tokenFrom: '...', tokenTo: '...' }
    }));
  }
  async function fetchAndDecodeTransactions(walletAddress, walletAlias, startBlock, endBlock) {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${etherscanApiKey}`;
    try {
        const response = await axios.get(url);
        const data = response.data; // Use `response.data` to access the response content
        console.log('data: ', data)
        if (data.status === '1') {
            console.log(`Transactions for address ${walletAddress}:`);
            for (const tx of data.result) {
              // console.log(tx)
                // Filter transactions by the target contract address
                if (tx.to.toLowerCase() === targetContractAddress) {
                    console.log(`Transaction to target contract: ${tx.hash}`);

                    // const receipt = await providerRPC.getTransactionReceipt(tx.hash);
                    // console.log(tx.hash)

                    dispatchAddTransaction({ 
                      hash: tx.hash, 
                      from: walletAddress, 
                      alias: walletAlias
                    });

                    // Decode transaction input to find tokenFrom and tokenTo
                    // const tokens = decodeTransactionInput(tx.input);
                    // dispatchTokensTransactions(dispatch, tx.hash, tokens);

                    // // Fetch the symbols and decimals of the tokens
                    // const tokenDetails = await getTokenDetails([tokens.tokenFrom, tokens.tokenTo]);
                    // console.log(`tokenDetails:`, tokenDetails)
                    // dispatchTokensTransactions(dispatch, tx.hash, tokenDetails);

                    // // Fetch the transaction receipt to get logs once confirmed to get the amounts
                    // const receipt = await providerRPC.getTransactionReceipt(tx.hash);
                    // const amounts = await decodeLogs(receipt)

                    // // Convert the amounts to human readable format
                    // const tokenToAmount = ethers.utils.formatUnits(amounts.amountOut, tokenDetails.tokenToDecimals);
                    // const tokenFromAmount = ethers.utils.formatUnits(amounts.amountIn, tokenDetails.tokenFromDecimals);

                    // const readableAmounts = formatTokenAmounts(amounts, tokenDetails)

                    // dispatchTokensTransactions(dispatch, tx.hash, readableAmounts);
                    
                    //Calculate rates
                      //Calculate the effective swap rate
                      //Calculate the current swap rate
                      //Calculate the price difference

                }
            }
        } else {
            console.error(`Error fetching transactions for address ${walletAddress}: ${data.message}`);
        }
    } catch (error) {
        console.error(`Error fetching transactions: ${error}`);
    }
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
      console.log(`test2: `, "TEST2")
      const currentBlock = await providerRPC.getBlockNumber();
      const blocksPerMonth = 4 * 60 * 24 * 30; // Approximation for blocks in a month
      const startBlock = currentBlock - (1 * blocksPerMonth); // Start block for roughly 3 months ago

      console.log(`Fetching and decoding historical transactions from about 3 months ago`);

      //Look for transactions from these wallets to Uniswap V2 router
      //Decode this transaction to derive TokenFrom and TokenTo
      //Decode the decimals from the TokenFrom and TokenTo contract
      //Decode the amounts swapped from the transaction receipts (needs decimmls)
      console.log('wallets: ', wallets)
      for (const wallet of wallets) {
          await fetchAndDecodeTransactions(wallet.walletAddress, wallet.alias, startBlock, currentBlock);
      }

      // listenForNewTransactions();
  }

  // useEffect(() => {
    main().catch(console.error);
  // }, []); // Empty dependency array means this effect runs only once on mount


};

export default ShadowTransactions;
