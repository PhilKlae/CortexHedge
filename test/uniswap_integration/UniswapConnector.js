const { ethers } = require("hardhat");
const { expect } = require("chai");
const { abi, bytecode } = require('@uniswap/v2-core/build/UniswapV2Factory.json')

describe("Uniswap connector contract", function() {
  let factory;
  let hardhatFactory;

  // let DAI;
  // let hardhatDAI;
  
  let EUR;
  let hardhatEUR;

  let uniConnector;
  let hardhatUniConnector;

  const uniFactoryKovan = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
  const uniRouterKovan = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
  const wethKovan = '0xd0A1E359811322d97991E03f863a0C30C2cF029C';
  const daiKovan = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa';

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    factory = new ethers.ContractFactory(abi, bytecode, owner);
    hardhatFactory = await factory.deploy(owner.address);

    // DAI = await ethers.getContractFactory("DAI");
    // hardhatDAI = await DAI.deploy(100000);

    EUR = await ethers.getContractFactory("EUR");
    hardhatEUR = await EUR.deploy(100000);

    uniConnector = await ethers.getContractFactory("UniswapConnector");
    hardhatUniConnector = await uniConnector.deploy(uniFactoryKovan);

    await hardhatFactory.deployed();
    // await hardhatDAI.deployed();
    await hardhatEUR.deployed();
    await hardhatUniConnector.deployed();
  })

  // test for DAI and EUR deployment are in test/utility/mockToken.js

  it("Deployment phase", async function () {
    expect(await hardhatFactory.address).not.be.null;
     // expect(await hardhatDAI.address).not.be.null;
     expect(await hardhatEUR.address).not.be.null;
     expect(await hardhatUniConnector.address).not.be.null;
  })

  it("Create uniswap pool from 2 token", async function () {
    const address = await hardhatUniConnector.getPairAddress(daiKovan, hardhatEUR.address);
    expect(address).not.be.null;
  })

  it("Should get the reserve of the pool DAI/WETH and the total supply", async function() {
    const result =  await hardhatUniConnector.computeLiquidityShareValue(
      100,
      daiKovan,
      hardhatEUR.address
    );

    // console.log(result);
  });
});
