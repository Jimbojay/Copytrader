import { ethers } from 'ethers'

import { 
	setProvider, 
	setNetwork, 
	setAccount 
} from './reducers/provider'

import {
	setContracts,
	setSymbols,
	balancesLoaded
} from './reducers/tokens'

import {
	setContract,
	sharesLoaded,
	swapsLoaded,
	depositRequest,
	depositSuccess,
	depositFail,
	withdrawRequest,
	withdrawSuccess,
	withdrawFail,
	swapRequest,
	swapSuccess,
	swapFail
} from './reducers/amm'

// import {
// 	setCopyContracts,
// 	setCopySymbols,
// 	setCopyDecimals
// } from './reducers/COPY_tokens'


// ABIs: Import your contract ABIs here
import TOKEN_ABI from '../abis/Token.json'
import AMM_ABI from '../abis/AMM.json'
import UNISWAP_ROUTER_ABI from '../abis/UniswapV2_Router.json';

// Config: Import your network config here
import config from '../config.json';

const { Token, Fetcher, Route, Trade, TokenAmount, TradeType, Percent} = require("@uniswap/sdk");

const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
const providerRPC = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const UNISWAP_ROUTER_CONTRACT = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, providerRPC)

async function waitForConfirmation(provider, transactionHash, confirmationsNeeded) {
    let confirmations = 0;

    while (confirmations < confirmationsNeeded) {
        try {
            const txReceipt = await provider.getTransactionReceipt(transactionHash);

            if (txReceipt && txReceipt.blockNumber) {
                const latestBlock = await provider.getBlockNumber();
                const confirmationsSoFar = latestBlock - txReceipt.blockNumber + 1;

                if (confirmationsSoFar >= confirmationsNeeded) {
                    console.log(`Transaction ${transactionHash} confirmed with ${confirmationsNeeded} confirmations.`);
                    return;
                } else {
                    console.log(`Transaction ${transactionHash} confirmed with ${confirmationsSoFar} confirmations. Waiting for more confirmations...`);
                }
            } else {
                console.log(`Transaction ${transactionHash} not yet confirmed. Waiting for confirmation...`);
            }
        } catch (error) {
            console.error(`Error while waiting for confirmation: ${error}`);
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking again
    }

    console.log(`Transaction ${transactionHash} not confirmed after ${confirmationsNeeded} confirmations.`);
}

export const loadProvider = (dispatch) =>{
	// Initiate provider
	const provider = new ethers.providers.Web3Provider(window.ethereum)
	dispatch(setProvider(provider))

	return provider

}

export const loadNetwork = async (provider, dispatch) =>{
	//Get network
	const { chainId } = await provider.getNetwork()
	dispatch(setNetwork(chainId))

	return chainId

}


export const loadAccount = async (dispatch) => {
	// Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    dispatch(setAccount(account))

    return account
}


//////////
// Load contracts
//////////

export const loadTokens = async (provider, chainId, dispatch) => {
	const dapp = new ethers.Contract(config[chainId].dapp.address, TOKEN_ABI, provider)
	const usd = new ethers.Contract(config[chainId].usd.address, TOKEN_ABI, provider)

	dispatch(setContracts([dapp, usd]))
	dispatch(setSymbols([await dapp.symbol(), await usd.symbol()]))

	// const tokens = [dapp, usd];
	// return tokens;

}

export const loadAMM = async (provider, chainId, dispatch) => {
	const amm = new ethers.Contract(config[chainId].amm.address, AMM_ABI, provider)

	dispatch(setContract(amm))

	return amm

}

//////////
// Load balances & shares
//////////
export const loadBalances = async (amm, tokens, account, dispatch) => {
	const balance1 = await tokens[0].balanceOf(account)
	const balance2 = await tokens[1].balanceOf(account)
	
	dispatch(balancesLoaded([
		ethers.utils.formatUnits(balance1.toString(), 'ether'),
		ethers.utils.formatUnits(balance2.toString(), 'ether')
	]))

	const shares = await amm.shares(account)
	dispatch(sharesLoaded(ethers.utils.formatUnits(shares.toString(), 'ether')))

}

/////////////
// Add liquidity
/////////////

export const addLiquidity = async (provider, amm, tokens, amounts, dispatch) => {
  try {
    dispatch(depositRequest())

    const signer = await provider.getSigner()

    let transaction

    transaction = await tokens[0].connect(signer).approve(amm.address, amounts[0])
    await transaction.wait()

    transaction = await tokens[1].connect(signer).approve(amm.address, amounts[1])
    await transaction.wait()

    transaction = await amm.connect(signer).addLiquidity(amounts[0], amounts[1])
    await transaction.wait()

    dispatch(depositSuccess(transaction.hash))
  } catch (error) {
    dispatch(depositFail())
  }
}

/////////////
// Remove liquidity
/////////////

export const removeLiquidity = async (provider, amm, shares, dispatch) => {
  try {
    dispatch(withdrawRequest())

    const signer = await provider.getSigner()

    let transaction = await amm.connect(signer).removeLiquidity(shares)
    await transaction.wait()

    dispatch(withdrawSuccess(transaction.hash))
  } catch (error) {
    dispatch(withdrawFail())
  }
}


/////////////
// Swap
/////////////

export const swap = async (provider, amm, token, symbol, amount, dispatch) => {
	try {
		// Tell Redux that the user is swapping...
		dispatch(swapRequest())

		let transaction;

		const signer = await provider.getSigner()

		transaction = await token.connect(signer).approve(amm.address, amount)
		await transaction.wait()

		if (symbol === "DAPP") {
			transaction = await amm.connect(signer).swapToken1(amount)
		} else {
			transaction = await amm.connect(signer).swapToken2(amount)
		}

		await transaction.wait()

		// Tell Redux that swap has finisehd
		dispatch(swapSuccess(transaction.hash))

	} catch (error) {
		dispatch(swapFail())	
	} 

}

/////////////
// Load swaps
/////////////

export const loadAllSwaps = async (provider, amm, dispatch) => {

	const block = await provider.getBlockNumber()

	const swapStream = await amm.queryFilter('Swap', 0, block)
	const swaps = swapStream.map(event => {
		return{ hash: event.transactionHash, args: event.args}
	})

	dispatch(swapsLoaded(swaps))

}




/////////////
// Swap2
/////////////

export const swapTokens = async (provider, tokenFrom, tokenTo, decimalsTokenFrom, decimalsTokenTo, amount, slippage)  => {

	const signer = await provider.getSigner()
	const signerAddress = await signer.getAddress()

	const TokenTo = new Token(
		1,
		tokenTo,
		decimalsTokenTo
	);

	const TokenFrom = new Token(
		1,
		tokenFrom,
		decimalsTokenFrom
	);

	try {

		const pair = await Fetcher.fetchPairData(TokenTo, TokenFrom, providerRPC); //creating instances of a pair
      	const route = await new Route([pair], TokenFrom); // a fully specified path from input token to output token

      	// Convert amount to Wei
		let amountIn = ethers.utils.parseUnits(amount.toString(),decimalsTokenFrom);

		// Initiate token contract
		const TOKEN_CONTRACT = new ethers.Contract(tokenFrom, TOKEN_ABI, providerRPC)

		const _slippage = slippage * 10
		console.log(_slippage)

		const slippageTolerance = new Percent(_slippage, '1000'); // 50 bips, or 0.50% - Slippage tolerance
		console.log("slippageTolerance:", slippageTolerance	)

		// Setup trade parameters
		const trade = new Trade( //information necessary to create a swap transaction.
			route,
			new TokenAmount(TokenFrom, amountIn),
			TradeType.EXACT_INPUT
		);

		const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
		const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
		const path = [tokenFrom, tokenTo]; //An array of token addresses
		// const to = signerAddress; // should be a checksummed recipient address
		const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
		const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
		const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string

		console.log("valueHex:", valueHex);

		let transaction

		//////////////ETHforTokens
			// if (tokenFrom == "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2") {
	  	// 	// console.log(amountOutMinHex, path, to, deadline)
	    //   //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
	    //   const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(amountOutMinHex, path, to, deadline, {
	    //       value: valueHex
	    //   })

		// 	console.log("rawTxn:", rawTxn);


		// 	// Sending the transaction and getting the Transaction Response object
		// 	transaction = await signer.sendTransaction(rawTxn);
		// 	console.log("Transaction Response:", sendTxn);
		// } else  {

		//Approve

		console.log("TEST_amountif:", amountIn)
		console.log("TEST_signer:", signerAddress.toString())
		console.log("TEST_UNI_Address:", ethers.utils.getAddress(UNISWAP_ROUTER_CONTRACT.address))

		transaction = await TOKEN_CONTRACT.connect(signer).approve(ethers.utils.getAddress(UNISWAP_ROUTER_CONTRACT.address), amountIn)
		await transaction.wait()
		console.log("approval:", transaction)

		// waitForConfirmation(provider, transaction.hash, 3);

		let allowance;
		try {
			allowance = await TOKEN_CONTRACT.allowance(signerAddress.toString(), ethers.utils.getAddress(UNISWAP_ROUTER_CONTRACT.address));
			console.log("allowance:", allowance);
		} catch (error) {
			console.error("Error fetching allowance:", error);
		}		    	
		
		/////////////////TokensToETH
		// if (tokenTo == "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2") {

			// 	transaction = await UNISWAP_ROUTER_CONTRACT.connect(signer).swapExactTokensForETH(amountIn, amountOutMinHex, path, signerAddress, deadline);
			// 	await transaction.wait()
			// 	console.log("transaction:", transaction)

			// } else {

		transaction = await UNISWAP_ROUTER_CONTRACT.connect(signer).swapExactTokensForTokens(amountIn, amountOutMinHex, path, signerAddress, deadline);
		const reciept = await transaction.wait()
		console.log("reciept1:", reciept)

		waitForConfirmation(provider, transaction.hash, 3);

		let allowance1;
		allowance1 = await TOKEN_CONTRACT.allowance(signerAddress.toString(), ethers.utils.getAddress(UNISWAP_ROUTER_CONTRACT.address).toString());
		console.log("allowance1:", allowance1);

		// 	}
			
		// }

		//////////////


		// Waiting for the transaction to be mined and getting the Transaction reciept
		// let reciept = await sendTxn.wait();
		// console.log("Transaction reciept:", reciept);
			

      // //Logs the information about the transaction it has been mined.
      // if (reciept) {
      //     console.log(" - Transaction is mined - " + '\n' 
      //     + "Transaction Hash:", await reciept.hash
      //     + '\n' + "Block Number: " 
      //     + (await reciept).blockNumber + '\n' 
      //     + "Navigate to https://rinkeby.etherscan.io/txn/" 
      //     + (await reciept).hash, "to see your transaction")
      // } else {
      //     console.log("Error submitting transaction")
      // }

    } catch(e) {
        console.log(e)
    }
}
