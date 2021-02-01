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
  const totalDAISupply = ethers.BigNumber.from("1000000000000000000000"); // 1000
  const initialContractBalance = ethers.BigNumber.from("100000000000000000000"); // 100
  const ownerDAISupply = totalDAISupply.sub(initialContractBalance);
  const approvedAmount = ethers.BigNumber.from("100000000000000000000"); // 100

  beforeEach('Deploy Contracts', async () => {
    // main swap contract
    SwapContract = await ethers.getContractFactory("SwapContract");
    hardhatSwapContract = await SwapContract.deploy();
    await hardhatSwapContract.deployed();
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

  });
  beforeEach('Set up accounts', async () => {
      // get addresses to interact
      [owner, minter, redeemer, ...addrs] = await ethers.getSigners();

  });

  beforeEach('Send initial Dai balance', async () => {
    // send initial supply of Dai to the pool
    await hardhatDAI.transfer(hardhatSwapContract.address, initialContractBalance);

  });


  describe("Start the savings phase", function () {
    it("Should allow Owner to start the savings phase", async function () {
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
    it("Should allow non-owner not to start the savings phase", async function () {
        await expect(
          hardhatSwapContract.connect(minter).start_saving()
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should change the phase after start_saving() is called", async function () {
      const old_phase = await hardhatSwapContract.current_phase();
      console.log("Before call the phase is", old_phase.toString());
      expect(old_phase).to.equal(0);

      await hardhatSwapContract.start_saving();

      const new_phase = await hardhatSwapContract.current_phase();
      console.log("Before call the phase is", new_phase.toString());
      expect(new_phase).to.equal(1);
    });
  });
  describe("Mint derivative tokens", function () {
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

});

