import UNISWAP_ROUTER_ABI from '../abis/UniswapV2_Router.json';

const { ethers } = require("ethers")
const UNISWAP = require("@uniswap/sdk")
// const fs = require('fs');
const { Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent} = require("@uniswap/sdk");
const { getAddress } = require("ethers/lib/utils");

const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
const providerRPC = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);


const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, providerRPC)

let wallet = '';

export async function swapTokens(token1, token2, decimalsToken1, decimalsToken2, amount, slippage = "50") {


    console.log("Value of token2:", token2);
    console.log("decimalsToken2 of token2:", decimalsToken2);

    const Token2 = new Token(
        1,
        token2,
        decimalsToken2
    );

    console.log("Token2instance:", Token2);

    const Token1 = new Token(
        1,
        token1,
        decimalsToken1
    );
    
    console.log("Token1instance:", Token1);

    try {


        const pair = await Fetcher.fetchPairData(Token1, Token2, providerRPC); //creating instances of a pair
        const route = await new Route([pair], Token2); // a fully specified path from input token to output token
        
        // Convert amount to Wei
        console.log("Amount:", amount);
        let amountIn = ethers.utils.parseEther(amount.toString());
        amountIn = amountIn.toString();
        console.log("Amount in Wei:", amountIn);

        // Logging token2 and amountIn before creating TokenAmount
        console.log("Type of token2:", typeof token2);
        console.log("Value of token2:", token2);
        console.log("Type of amountIn:", typeof amountIn);
        console.log("Value of amountIn:", amountIn);

        const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance

        const trade = new Trade( //information necessary to create a swap transaction.
                route,
                new TokenAmount(Token2, amountIn),
                TradeType.EXACT_INPUT
        );

        console.log(trade)

        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
        // console.log
        const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
        const path = [token2, token1]; //An array of token addresses
        const to = wallet.address; // should be a checksummed recipient address
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
        const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
        const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string

        console.log("valueHex:", valueHex);
    
        //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
        const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(amountOutMinHex, path, to, deadline, {
            value: valueHex
        })
    
        // //Returns a Promise which resolves to the transaction.
        // let sendTxn = (await wallet).sendTransaction(rawTxn)
        

        // //Resolves to the TransactionReceipt once the transaction has been included in the chain for x confirms blocks.
        // let reciept = (await sendTxn).wait()

        // //Logs the information about the transaction it has been mined.
        // if (reciept) {
        //     console.log(" - Transaction is mined - " + '\n' 
        //     + "Transaction Hash:", (await sendTxn).hash
        //     + '\n' + "Block Number: " 
        //     + (await reciept).blockNumber + '\n' 
        //     + "Navigate to https://rinkeby.etherscan.io/txn/" 
        //     + (await sendTxn).hash, "to see your transaction")
        // } else {
        //     console.log("Error submitting transaction")
        // }

    } catch(e) {
        console.log(e)
    }
}
