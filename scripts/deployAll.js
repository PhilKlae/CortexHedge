const { expect } = require("ethers");
const { hexStripZeros } = require("ethers/lib/utils");
const hre = require("hardhat");

import { DeployCurve } from './1_deploy_curve_module';
import { DeploySwapper } from './2_deploy_swap_module';

async function main() {
  accounts = await ethers.getSigners()
  let owner = accounts[0];

  console.log("owner: " + owner.address);
  console.log("selected net: " + hre.network.name);

  let addressDict = {};

  if (hre.network.name == "hardhat") { //mainnet fork or local net 

    //Mainnet
    addressDict["DAI"] = 0x6b175474e89094c44da98b954eedeac495271d0f;
    addressDict["aDAI"] = 0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d;
    addressDict["AaveLendingPoolProvider"] = 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5;
    addressDict["Chainlink"] = 0xb49f677943BC038e9857d61E7d053CaA2C1734C1;
    addressDict["UniFactory"] = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;//v2
    addressDict["UniRouter"] = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    addressDict["Weth"] = 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2;


  } else if (hre.network.name == "Kovan") {

    //KovanAddresses
    addressDict["DAI"] = 0xff795577d9ac8bd7d90ee22b6c1703490b6512fd;
    addressDict["aDAI"] = 0xdcf0af9e59c002fa3aa091a46196b37530fd48a8;
    addressDict["AaveLendingPoolProvider"] = 0x88757f2f99175387ab4c6a4b3067c77a695b0349;
    addressDict["Chainlink"] = 0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13;//0xb49f677943BC038e9857d61E7d053CaA2C1734C1 mainnet
    addressDict["UniFactory"] = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    addressDict["UniRouter"] = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    addressDict["Weth"] = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;

  }

  await DeployCurve(addressDict);

  await DeploySwapper(addressDict);
  

  
  //deploy eurs
  //deploy seur

  //deploy curvefake

  //deploy curve helper

  //deploy uniswap pool seur DAI/

  //deploy uniswap pool eurs DAI/

  //deploy uniswap helper

  //deploy swap contract

  //deploy euro fixed

  //deploy usd float

  return addressDict;
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });