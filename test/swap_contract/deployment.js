const { expect } = require("chai");
const { waffle } = require("hardhat");

describe("Swap Contract deployment", function () {
  let swapcontract;

  let eurfix;
  let usdfloat;
  let dai;

  let owner;
  let minter;
  let redeemer;
  let addrs;


  // test data. Use BigNumber to avoid overflow
  const totalDAISupply = ethers.BigNumber.from("1000000000000000000000"); // 1000

  beforeEach(async () => {

    // get addresses to interact
    [owner, minter, redeemer, ...addrs] = await ethers.getSigners();

    // main swap contract
    const SwapContract = await ethers.getContractFactory("SwapContract");
    swapcontract = await SwapContract.connect(owner).deploy();
    await swapcontract.deployed();
  
    // launch auxillary tokens and connect to main contract
    const EURFIX = await ethers.getContractFactory("EURFIX");
    eurfix = await EURFIX.connect(owner).deploy(swapcontract.address);
    await eurfix.deployed();

    const USDFLOAT = await ethers.getContractFactory("USDFLOAT");
    usdfloat = await USDFLOAT.connect(minter).deploy(swapcontract.address);
    await usdfloat.deployed();

    const DAI = await ethers.getContractFactory("DAI");
    dai = await DAI.connect(minter).deploy(totalDAISupply);
    await dai.deployed();

    // give derivative contract address to main address
    await swapcontract.connect(owner).set_EURFIX_address(eurfix.address);
    await swapcontract.connect(owner).set_USDFLOAT_address(usdfloat.address);
    await swapcontract.connect(owner).set_Dai_address(dai.address);
  });
  describe("Check state variables", function () {
    it("Should print the inverse leverage factor", async function () {
      const inverse_leverage = await swapcontract.leverage_inverse();
      console.log("Inverse leverage is: " , inverse_leverage.toString());
    });
  });

  describe("Deployment", function () {
    it("Should give Swap Contract the MINTER_ROLE", async function() {
      // Deployer address should receive the MINTER_ROLE
      const minter_role = await eurfix.MINTER_ROLE();
      expect(await eurfix.hasRole(minter_role, swapcontract.address)).to.be.true;
    });
    it("Should set the correct (EURFIX) address in SwapContract ", async function () {
      // token address should be saved correctly
      expect(await swapcontract.EURFIX_address()).to.equal(eurfix.address);
    });
    it("Should set the correct (USDFLOAT) address in SwapContract ", async function () {
      // token address should be saved correctly
      expect(await swapcontract.USDFLOAT_address()).to.equal(usdfloat.address);
    });
    it("Should set the correct (DAI) address in SwapContract ", async function () {
      // token address should be saved correctly
      expect(await swapcontract.Dai_address()).to.equal(dai.address);
    });
  });
});

