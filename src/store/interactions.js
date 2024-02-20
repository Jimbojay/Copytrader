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

export const swapTokens = async (provider, tokenFrom, tokenTo, decimalsTokenFrom, decimalsTokenTo, amount, slippage = "50")  => {

	// console.log(provider, tokenFrom, tokenTo, decimalsTokenTo, decimalsTokenTo, amount)

	const signer = await provider.getSigner()
	console.log("signer:", signer);
	const signerAddress = await signer.getAddress()
  console.log("signeraddress:", signerAddress);



  // console.log("Value of token2:", token2);
  // console.log("Value of token1:", token1);
  // console.log("decimalsToken2 of token2:", decimalsToken2);

  const TokenTo = new Token(
      1,
      tokenTo,
      decimalsTokenTo
  );

  console.log("TokenTo:", TokenTo);

  const TokenFrom = new Token(
      1,
      tokenFrom,
      decimalsTokenFrom
  );
  
  console.log("TokenFrom:", TokenFrom);

	// const Token2 = new Token(
	//     UNISWAP.ChainId.RINKEBY,
	//     "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa",
	//     18
	// );

	// const Token1 = WETH[DAI.chainId]



  try {


      const pair = await Fetcher.fetchPairData(TokenTo, TokenFrom, providerRPC); //creating instances of a pair
      const route = await new Route([pair], TokenFrom); // a fully specified path from input token to output token
      
      // Convert amount to Wei
      // console.log("Amount:", amount);
      let amountIn = ethers.utils.parseUnits(amount.toString(),decimalsTokenFrom);

			const TOKEN_CONTRACT = new ethers.Contract(tokenFrom, TOKEN_ABI, providerRPC)

			// console.log("TOKEN_CONTRACT:", TOKEN_CONTRACT)
			// console.log("signer:", signer)
			// console.log("UNISWAP_ROUTER_CONTRACT:", UNISWAP_ROUTER_CONTRACT.address)
			console.log("amount:", amountIn)


      // amountIn = amountIn.toString();
      // console.log("Amount in Wei:", amountIn);

      // Logging token2 and amountIn before creating TokenAmount
      // console.log("Type of token2:", typeof token2);
      // console.log("Value of token2:", token2);
      // console.log("Type of amountIn:", typeof amountIn);
      // console.log("Value of amountIn:", amountIn);



      const slippageTolerance = new Percent(slippage, "10000"); // 50 bips, or 0.50% - Slippage tolerance

      console.log("slippageTolerance:", slippageTolerance)

      const trade = new Trade( //information necessary to create a swap transaction.
              route,
              new TokenAmount(TokenFrom, amountIn),
              TradeType.EXACT_INPUT
      );

      console.log(trade)

      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
      // console.log
      const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString();
      const path = [tokenFrom, tokenTo]; //An array of token addresses
      const to = signerAddress; // should be a checksummed recipient address
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
      const value = trade.inputAmount.raw; // // needs to be converted to e.g. hex
      const valueHex = await ethers.BigNumber.from(value.toString()).toHexString(); //convert to hex string

      console.log("valueHex:", valueHex);

			////////////////////////////////

      let sendTxn

			if (tokenFrom == "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2") {
	  		// console.log(amountOutMinHex, path, to, deadline)
	      //Return a copy of transactionRequest, The default implementation calls checkTransaction and resolves to if it is an ENS name, adds gasPrice, nonce, gasLimit and chainId based on the related operations on Signer.
	      const rawTxn = await UNISWAP_ROUTER_CONTRACT.populateTransaction.swapExactETHForTokens(amountOutMinHex, path, to, deadline, {
	          value: valueHex
	      })

				console.log("rawTxn:", rawTxn);
	  

				// Sending the transaction and getting the Transaction Response object
				sendTxn = await signer.sendTransaction(rawTxn);
				console.log("Transaction Response:", sendTxn);
			} else  {

				let transaction

				transaction = await TOKEN_CONTRACT.connect(signer).approve(ethers.utils.getAddress(UNISWAP_ROUTER_CONTRACT.address), amountIn)
	    	await transaction.wait()
				console.log("transaction:", transaction)

				console.log("signerAddress:", signerAddress)
				console.log("amm address:", ethers.utils.getAddress(UNISWAP_ROUTER_CONTRACT.address))

				const allowance = await TOKEN_CONTRACT.allowance(signerAddress, ethers.utils.getAddress(UNISWAP_ROUTER_CONTRACT.address));
	    	console.log("allowance:", allowance)

				// await transaction.wait()

				console.log("transaction post:", transaction)

				transaction = await UNISWAP_ROUTER_CONTRACT.connect(signer).swapExactTokensForETH(amountIn, amountOutMinHex, path, signerAddress, deadline);
				await transaction.wait()
				console.log("transaction:", transaction)
				
			}

			//////////////
  

			// Waiting for the transaction to be mined and getting the Transaction Receipt
			// let receipt = await sendTxn.wait();
			// console.log("Transaction Receipt:", receipt);
			

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
