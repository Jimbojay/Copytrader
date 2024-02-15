require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
// or, if you're using Infura
// const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;

const FORK_MAINNET = process.env.FORK_MAINNET === 'true';

let hardhatNetworkConfig = { solidity: "0.8.9" };

if (FORK_MAINNET && ALCHEMY_API_KEY) {
  hardhatNetworkConfig.networks = {
    hardhat: {
      loggingEnabled: true,
      chainId: 1,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        // for Infura, it would be:
        // url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        // You can also specify a block number to fork from (optional):
        // blockNumber: 12345678,
      }
    }
  };
}

module.exports = hardhatNetworkConfig;
