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

  let EURFIX_amount;
  let USDFLOAT_amount;

  // test data. Use BigNumber to avoid overflow
  const totalDAISupply = ethers.BigNumber.from("1000000000000000000000"); // 1000
  const initialContractBalance = ethers.BigNumber.from("100000000000000000000"); // 100
  const ownerDAISupply = totalDAISupply.sub(initialContractBalance);
  const approvedAmount = ethers.BigNumber.from("100000000000000000000"); // 100

  beforeEach('Set up accounts', async () => {
    // get addresses to interact
    [owner, minter, redeemer, ...addrs] = await ethers.getSigners();
  });
  
  beforeEach('Deploy Contracts', async () => {
    // main swap contract
    SwapContract = await ethers.getContractFactory("SwapContract");
    hardhatSwapContract = await SwapContract.connect(owner).deploy();
    await hardhatSwapContract.deployed();
    // launch auxillary tokens and connect to main contract
    EURFIX = await ethers.getContractFactory("EURFIX");
    hardhatEURFIX = await EURFIX.connect(minter).deploy(hardhatSwapContract.address);
    await hardhatEURFIX.deployed();

    USDFLOAT = await ethers.getContractFactory("USDFLOAT");
    hardhatUSDFLOAT = await USDFLOAT.connect(redeemer).deploy(hardhatSwapContract.address);
    await hardhatUSDFLOAT.deployed();

    DAI = await ethers.getContractFactory("DAI");
    hardhatDAI = await DAI.connect(owner).deploy(totalDAISupply);
    await hardhatDAI.deployed();

    // give derivative contract address to main address
    await hardhatSwapContract.set_EURFIX_address(hardhatEURFIX.address);
    await hardhatSwapContract.set_USDFLOAT_address(hardhatUSDFLOAT.address);
    await hardhatSwapContract.set_Dai_address(hardhatDAI.address);

  });


  beforeEach('Send initial Dai balance', async () => {
    // send initial supply of Dai to the pool
    await hardhatDAI.transfer(hardhatSwapContract.address, initialContractBalance);

  });
  beforeEach('Initial transactions', async () => {
      // send some initial Dai to the contract
      await hardhatSwapContract.start_saving();
      // start minting coins 
      await hardhatDAI.connect(owner).approve(hardhatSwapContract.address, approvedAmount);
      const dai_allowance = await hardhatDAI.allowance(owner.address, hardhatSwapContract.address);
      console.log(
        "Swap contract can spend up to ",
        dai_allowance.toString(),
        "Dai"
      );
      await hardhatSwapContract.connect(owner).invest(approvedAmount);
      console.log(
        "Owner has ", 
        ethers.utils.formatEther(await hardhatEURFIX.balanceOf(owner.address)),
        "EURFIX and ", 
        ethers.utils.formatEther(await hardhatUSDFLOAT.balanceOf(owner.address)), 
        "USDFLOAT");
      EURFIX_amount = await hardhatEURFIX.balanceOf(owner.address);
      USDFLOAT_amount = await hardhatUSDFLOAT.balanceOf(owner.address);
      //await hardhatDAI.transfer(hardhatSwapContract.address, 5000000); // simulate some interest earned
  });
  beforeEach('Give allowance to burn EURFIX/USDFLOAT', async () => {
    // send some initial Dai to the contract
    await hardhatUSDFLOAT.connect(owner).approve(hardhatSwapContract.address, approvedAmount);
    await hardhatEURFIX.connect(owner).approve(hardhatSwapContract.address, approvedAmount);
});

  describe("Start the redeeming phase", function () {
    it("Should allow Owner to start the redeeming phase", async function () {
      // contract call
      await hardhatSwapContract.start_redeeming();
      const exchange_rate_end = await hardhatSwapContract.exchange_rate_end();
      
      // should be sucessful
      expect(exchange_rate_end).not.be.null;
      expect(exchange_rate_end).to.equal(await hardhatSwapContract.getEUROPrice());
      const principal_balance = await hardhatSwapContract.total_pool_prinicipal();
      console.log(
        "Swap Contract can spend up to ",
        ethers.utils.formatEther(principal_balance),
        "Dai"
      );
    });
    it("Should change the phase after start_redeeming() is called", async function () {
      const old_phase = await hardhatSwapContract.current_phase();
      console.log("Before call the phase is", old_phase.toString());
      expect(old_phase).to.equal(1);

      await hardhatSwapContract.start_redeeming();

      const new_phase = await hardhatSwapContract.current_phase();
      console.log("Before call the phase is", new_phase.toString());
      expect(new_phase).to.equal(2);
    });
  });
  describe("Should redeem the correct amount of tokens", function () {
    it("Should allow Whale to redeem both tokens", async function () {
      // contract call
      console.log(
        "Swap contract can spend up to ",
        (await hardhatUSDFLOAT.allowance(owner.address, hardhatSwapContract.address)).toString(),
        "USDFLOAT"
      );
      console.log(
        "Swap contract can spend up to ",
        (await hardhatEURFIX.allowance(owner.address, hardhatSwapContract.address)).toString(),
        "EURFIX"
      );
      console.log(
        "Owner has ", 
        ethers.utils.formatEther(await hardhatDAI.balanceOf(owner.address)),
        "DAI ")

      hardhatSwapContract.redeem(EURFIX_amount,USDFLOAT_amount);
      console.log(
        "Owner has ", 
        ethers.utils.formatEther(await hardhatEURFIX.balanceOf(owner.address)),
        "EURFIX and ", 
        ethers.utils.formatEther(await hardhatUSDFLOAT.balanceOf(owner.address)), 
        "USDFLOAT");
      console.log(
        "Owner has ", 
        ethers.utils.formatEther(await hardhatDAI.balanceOf(owner.address)),
        "DAI ")

    });
    it("Should not allow Whale to redeem both with uneven numbers", async function () {
      await expect(
        hardhatSwapContract.redeem(EURFIX_amount.sub("1"),USDFLOAT_amount)
      ).to.be.revertedWith("Must exchange same amount of EURFIX and USDFLOAT");
    });
    it("Should allow person to one token at a time", async function () {
      await hardhatSwapContract.start_redeeming();
      await hardhatSwapContract.connect(owner).redeem_EURFIX(5);
    });
  });
});
