const { expect } = require("chai");
const { waffle } = require("hardhat");

describe("Swap Contract", function () {
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
  const totalDAISupply = ethers.BigNumber.from("1000000000000000000000");
  const initialContractBalance = ethers.BigNumber.from("100000000000000000000");
  const ownerDAISupply = totalDAISupply.sub(initialContractBalance);
  const approvedAmount = ethers.BigNumber.from("100000000000000000000");

  beforeEach(async () => {

    // main swap contract
    SwapContract = await ethers.getContractFactory("SwapContract");
    hardhatSwapContract = await SwapContract.deploy();
    await hardhatSwapContract.deployed();
  
    // get addresses to interact
    [owner, minter, redeemer, ...addrs] = await ethers.getSigners();

    // launch auxillary tokens and connect to main contract
    EURFIX = await ethers.getContractFactory("EURFIX");
    hardhatEURFIX = await EURFIX.deploy(hardhatSwapContract.address);
    await hardhatEURFIX.deployed();

    USDFLOAT = await ethers.getContractFactory("USDFLOAT");
    hardhatUSDFLOAT = await USDFLOAT.deploy(hardhatSwapContract.address);
    await hardhatUSDFLOAT.deployed();

    DAI = await ethers.getContractFactory("DAI");
    hardhatDAI = await DAI.deploy(totalDAISupply);
    await hardhatDAI.deployed();

    // give derivative contract address to main address
    await hardhatSwapContract.set_EURFIX_address(hardhatEURFIX.address);
    await hardhatSwapContract.set_USDFLOAT_address(hardhatUSDFLOAT.address);
    await hardhatSwapContract.set_Dai_address(hardhatDAI.address);

    // send initial supply of Dai to the pool
    await hardhatDAI.transfer(hardhatSwapContract.address, initialContractBalance);

  });


  describe("Savings Period", function () {
    it("Should allow Owner to start the savings period", async function () {
      // contract call
      await hardhatSwapContract.start_saving();
      const exchange_rate_start = await hardhatSwapContract.exchange_rate_start();
      
      // should be sucessfull
      expect(exchange_rate_start).not.be.null;
      expect(exchange_rate_start).to.equal(await hardhatSwapContract.getEUROPrice());
      const principal_balance = await hardhatSwapContract.total_pool_prinicipal();
      console.log(
        "Swap Contract can spend up to ",
        ethers.utils.formatEther(principal_balance),
        "Dai"
      )
    });
    it("Should allow non-owner not to start the savings period", async function () {
        await expect(
          hardhatSwapContract.connect(minter).start_saving()
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
  describe("Minting process", function () {
    it("Should give the deployer of DAI some tokens", async function() {
      // Deployer address should receive the MINTER_ROLE
      const ownerBalance = await hardhatDAI.balanceOf(owner.address);
      expect(await ownerDAISupply).to.equal(ownerBalance);
    });
    it("Should give give Swap Contract allowance to spend dai", async function () {

      // give approval 
      await hardhatDAI.approve(hardhatSwapContract.address, approvedAmount);

      // check allowance
      const SwapContractAllowance = await hardhatDAI.allowance(owner.address, hardhatSwapContract.address)
      console.log(
        "Swap Contract can spend up to ",
        ethers.utils.formatEther(SwapContractAllowance),
        "Dai"
      )
      expect(SwapContractAllowance).to.be.equal(approvedAmount);
    });

    it("Should exchange dai for both certificates", async function () {

      // send some initial Dai to the contract
      await hardhatSwapContract.start_saving();
      // start minting coins 
      await hardhatDAI.approve(hardhatSwapContract.address, approvedAmount);
      await hardhatSwapContract.invest(approvedAmount);
      console.log(
        "Owner has ", 
        ethers.utils.formatEther(await hardhatEURFIX.balanceOf(owner.address)),
        "EURFIX and ", 
        ethers.utils.formatEther(await hardhatUSDFLOAT.balanceOf(owner.address)), 
        "USDFLOAT");
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

