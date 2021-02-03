require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
// Go to https://infura.io/ and create a new project
// Replace this with your Infura project ID


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

const infuraProjectId = process.env.INFURA_ID;
const mnemonic = process.env.DEV_MNEMONIC;
const alchemyAPI = process.env.ALCHEMY_API;

// Replace this private key with your Ropsten account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Be aware of NEVER putting real Ether into testing accounts

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        // fix block number to speed up forkings
        url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyAPI}`,
        blockNumber: 11758657 
      }
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${infuraProjectId}`,
      accounts: {mnemonic: mnemonic}
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${infuraProjectId}`,
      accounts: {mnemonic: mnemonic}
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${infuraProjectId}`,
      accounts: {mnemonic: mnemonic}
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${infuraProjectId}`,
      accounts: {mnemonic: mnemonic}
    }
  },
  solidity: {
    compilers: [
      {
      version: "0.7.3",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
      },
      {
        version: "0.6.12",
        settings: { } 
      }
      ,
      {
        version: "0.5.12",
        settings: { } 
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 20000
  }
}