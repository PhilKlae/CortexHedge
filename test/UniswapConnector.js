const { ethers } = require("hardhat");
const { expect } = require("chai");
const contract = require('@truffle/contract');
const FactoryBytecode = require('@uniswap/v2-core/build/UniswapV2Factory.json')
const UniswapV2Factory = contract(FactoryBytecode);

const UniswapV2FactoryBytecode = require('@uniswap/v2-core/build/UniswapV2Factory.json').bytecode


describe("Uniswap connector contract", function() {
  it("Should get the reserve of the pool DAI/WETH and the total supply", async function() {
    const [owner] = await ethers.getSigners();


    const uniswapFactoryKovan = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
    const wethKovan = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
    const daiKovan = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'

    const Factory = await ethers.getContractAt(FactoryBytecode)
    const hardhatFactory = await Factory.deploy()

    console.log(hardhatFactory)

    const Uniswap = await ethers.getContractFactory("UniswapConnector");
    const hardhatUniswap = await Uniswap.deploy(uniswapFactoryKovan);

    // console.log('hello', hardhatUniswap)

    // const factory = await hardhatUniswap.getInfo()
    // console.log(factory)
    // const result =  await hardhatUniswap.computeLiquidityShareValue(
    //   100,
    //   wethKovan,
    //   daiKovan
    // )

    console.log(result)
    // const ownerBalance = await hardhatToken.balanceOf(owner.address);
    // expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
});

