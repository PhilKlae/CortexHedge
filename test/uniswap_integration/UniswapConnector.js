const { ethers } = require("hardhat");
const { expect } = require("chai");
const { abi, bytecode } = require('@uniswap/v2-core/build/UniswapV2Factory.json')

describe("Uniswap connector contract", function() {
  let factory;
  let hardhatFactory;

  let DAI;
  let hardhatDAI;
  
  let EUR;
  let hardhatEUR;

  let uniConnector;
  let hardhatUniConnector;

  const uniFactoryKovan = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    factory = new ethers.ContractFactory(abi, bytecode, owner);
    hardhatFactory = await factory.deploy(owner.address);

    DAI = await ethers.getContractFactory("DAI");
    hardhatDAI = await DAI.deploy(100000);

    EUR = await ethers.getContractFactory("EUR");
    hardhatEUR = await EUR.deploy(100000);

    uniConnector = await ethers.getContractFactory("UniswapConnector");
    hardhatUniConnector = await uniConnector.deploy(uniFactoryKovan);

    await hardhatFactory.deployed();
    await hardhatDAI.deployed();
    await hardhatEUR.deployed();
    await hardhatUniConnector.deployed();
  })

  // test for DAI and EUR deployment are in test/utility/mockToken.js

  it("Deployment phase", async function () {
      expect(await hardhatFactory.address).not.be.null;
      expect(await hardhatDAI.address).not.be.null;
      expect(await hardhatEUR.address).not.be.null;
      expect(await hardhatUniConnector.address).not.be.null;
  })

  it("Should get the reserve of the pool DAI/WETH and the total supply", async function() {
    const result =  await hardhatUniConnector.computeLiquidityShareValue(
      100,
      hardhatDAI.address,
      hardhatEUR.address
    );

    // console.log(result);
  });
});
