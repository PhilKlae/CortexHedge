const { expect } = require("chai");
const { waffle } = require("hardhat");

describe("Swap Contract deployment", function () {
  let SwapContract;
  let hardhatSwapContract;

  let EURFIX;
  let hardhatEURFIX;
  let USDFLOAT;
  let hardhatUSDFLOAT;
  let DAI;
  let hardhatDAI;

  let owner;
  let minter;
  let redeemer;
  let addrs;

  // test data. Use BigNumber to avoid overflow
  const totalDAISupply = ethers.BigNumber.from("1000000000000000000000"); // 1000
  const initialContractBalance = ethers.BigNumber.from("100000000000000000000"); // 100
  const ownerDAISupply = totalDAISupply.sub(initialContractBalance);
  const approvedAmount = ethers.BigNumber.from("100000000000000000000"); // 100

  // parameterization
  const leverage = 10;
  
  beforeEach(async () => {

    // get addresses to interact
    [owner, minter, redeemer, ...addrs] = await ethers.getSigners();

    // main swap contract
    SwapContract = await ethers.getContractFactory("SwapContract");
    hardhatSwapContract = await SwapContract.connect(owner).deploy();
    await hardhatSwapContract.deployed();
  
    // launch auxillary tokens and connect to main contract
    EURFIX = await ethers.getContractFactory("EURFIX");
    hardhatEURFIX = await EURFIX.connect(owner).deploy(hardhatSwapContract.address);
    await hardhatEURFIX.deployed();

    USDFLOAT = await ethers.getContractFactory("USDFLOAT");
    hardhatUSDFLOAT = await USDFLOAT.connect(minter).deploy(hardhatSwapContract.address);
    await hardhatUSDFLOAT.deployed();

    DAI = await ethers.getContractFactory("DAI");
    hardhatDAI = await DAI.connect(minter).deploy(totalDAISupply);
    await hardhatDAI.deployed();

    // give derivative contract address to main address
    await hardhatSwapContract.connect(owner).set_EURFIX_address(hardhatEURFIX.address);
    await hardhatSwapContract.connect(owner).set_USDFLOAT_address(hardhatUSDFLOAT.address);
    await hardhatSwapContract.connect(owner).set_Dai_address(hardhatDAI.address);
  });
  /*
  describe("Inheritance", function () {
    it("Can access the price oracles from Price Consumer Contract", async function () {
      expect(await hardhatSwapContract.getDAIPrice()).not.be.null;
    });
  });
  */
  describe("Check state variables", function () {
    it("Should print the inverse leverage factor", async function () {
      const inverse_leverage = await hardhatSwapContract.leverage_inverse();
      console.log("Inverse leverage is: " , inverse_leverage.toString());
    });
  });

  describe("Deployment", function () {
    it("Should give Swap Contract the MINTER_ROLE", async function() {
      // Deployer address should receive the MINTER_ROLE
      const minter_role = await hardhatEURFIX.MINTER_ROLE();
      expect(await hardhatEURFIX.hasRole(minter_role, hardhatSwapContract.address)).to.be.true;
    });
    it("Should set the correct (EURFIX) address in SwapContract ", async function () {
      // token address should be saved correctly
      expect(await hardhatSwapContract.EURFIX_address()).to.equal(hardhatEURFIX.address);
    });
    it("Should set the correct (USDFLOAT) address in SwapContract ", async function () {
      // token address should be saved correctly
      expect(await hardhatSwapContract.USDFLOAT_address()).to.equal(hardhatUSDFLOAT.address);
    });
    it("Should set the correct (DAI) address in SwapContract ", async function () {
      // token address should be saved correctly
      expect(await hardhatSwapContract.Dai_address()).to.equal(hardhatDAI.address);
    });
  });


});

