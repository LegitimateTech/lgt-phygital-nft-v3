import dotenv from 'dotenv'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import {HardhatUserConfig} from 'hardhat/types/config';

dotenv.config()

const { INFURA_API_KEY, PRIVATE_KEY, ETHERSCAN_API_KEY, POLYGONSCAN_KEY, SNOWTRACE_API_KEY } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.2",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      /**
      accounts: [{
        privateKey: `0x${PRIVATE_KEY}`,
        balance: '100000000000000000000'
      }],
      **/
      chainId: 1337,
      // forking: {
      //   url: "https://rinkeby.infura.io/v3/" + INFURA_API_KEY,
      //   blockNumber: 7425305
      // }
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + INFURA_API_KEY,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    goerli: {
      url: "https://goerli.infura.io/v3/" + INFURA_API_KEY,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/" + INFURA_API_KEY,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    polygon: {
      url: "https://polygon-mainnet.infura.io/v3/" + INFURA_API_KEY,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    polygonMumbai: {
      url: "https://polygon-mumbai.infura.io/v3/" + INFURA_API_KEY,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    avalancheFujiTestnet: {
      url: "https://avalanche-fuji.infura.io/v3/" + INFURA_API_KEY,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    avalanche: {
      url: "https://avalanche-mainnet.infura.io/v3/" + INFURA_API_KEY,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      rinkeby: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_KEY,
      polygonMumbai: POLYGONSCAN_KEY,
      avalancheFujiTestnet: SNOWTRACE_API_KEY,
      avalanche: SNOWTRACE_API_KEY,
    }
  }
}

export default config
