const { expect } = require("chai");
const { waffle } = require("hardhat");
const { utils } = require("ethers");

describe("Swap Contract", function () {
  let swapcontract;

  let eurfix;
  let usdfloat;
  let dai;

  let owner;
  let minter;
  let redeemer;
  let addrs;

  let eurfix_amount;
  let usdfloat_amount;

  // test data. Use BigNumber to avoid overflow
  const fullAmount = utils.parseEther("1000"); // 1000
  const approvedAmount = utils.parseEther("100"); // 100
  const initialContractBalance = utils.parseEther("100"); // 100

  beforeEach('Set up accounts', async () => {
    // get addresses to interact
    [owner, minter, redeemer, ...addrs] = await ethers.getSigners();

    await OccupyDAI(owner, fullAmount);

  });
  
  beforeEach('Deploy Contracts', async () => {
    // main swap contract
    const Swapcontract = await ethers.getContractFactory("SwapContract");
    swapcontract = await Swapcontract.connect(owner).deploy();
    await swapcontract.deployed();
    // launch auxillary tokens and connect to main contract
    const EURFIX = await ethers.getContractFactory("EURFIX");
    eurfix = await EURFIX.connect(minter).deploy(swapcontract.address);
    await eurfix.deployed();

    const Usdfloat = await ethers.getContractFactory("USDFLOAT");
    usdfloat = await Usdfloat.connect(redeemer).deploy(swapcontract.address);
    await usdfloat.deployed();
    
    dai = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', '0x6b175474e89094c44da98b954eedeac495271d0f');    

    // give derivative contract address to main address
    await swapcontract.set_EURFIX_address(eurfix.address);
    await swapcontract.set_USDFLOAT_address(usdfloat.address);
    await swapcontract.set_Dai_address(dai.address);

  });


  beforeEach('Send initial Dai balance', async () => {
    // send initial supply of Dai to the pool
    await dai.transfer(swapcontract.address, initialContractBalance);

  });
  beforeEach('Initial transactions', async () => {
      // send some initial Dai to the contract
      await swapcontract.start_saving();
      // start minting coins 
      await dai.connect(owner).approve(swapcontract.address, approvedAmount);
      const dai_allowance = await dai.allowance(owner.address, swapcontract.address);
      //console.log(
      //  "Swap contract can spend up to ",
      //  dai_allowance.toString(),
      //  "Dai"
      //);
      await swapcontract.connect(owner).invest(approvedAmount);
      //console.log(
      //  "Owner has ", 
      //  utils.formatEther(await eurfix.balanceOf(owner.address)),
      //  "EURFIX and ", 
      //  utils.formatEther(await usdfloat.balanceOf(owner.address)), 
      //  "usdfloat");
      eurfix_amount = await eurfix.balanceOf(owner.address);
      usdfloat_amount = await usdfloat.balanceOf(owner.address);
      //await dai.transfer(swapcontract.address, 5000000); // simulate some interest earned
  });
  beforeEach('Give allowance to burn EURFIX/usdfloat', async () => {
    // send some initial Dai to the contract
    await usdfloat.connect(owner).approve(swapcontract.address, approvedAmount);
    await eurfix.connect(owner).approve(swapcontract.address, approvedAmount);
});

  describe("Start the redeeming phase", function () {
    it("Should allow Owner to start the redeeming phase", async function () {
      // contract call
      await swapcontract.start_redeeming();
      const exchange_rate_end = await swapcontract.exchange_rate_end();
      
      // should be sucessful
      expect(exchange_rate_end).not.be.null;
      expect(exchange_rate_end).to.equal(await swapcontract.getEUROPrice());
      const principal_balance = await swapcontract.total_pool_prinicipal();
      //console.log(
      //  "Swap Contract can spend up to ",
      //  utils.formatEther(principal_balance),
      //  "Dai"
      //);
    });
    it("Should change the phase after start_redeeming() is called", async function () {
      const old_phase = await swapcontract.current_phase();
      console.log("Before call the phase is", old_phase.toString());
      expect(old_phase).to.equal(1);

      await swapcontract.start_redeeming();

      const new_phase = await swapcontract.current_phase();
      console.log("Before call the phase is", new_phase.toString());
      expect(new_phase).to.equal(2);
    });
  });
  describe("Should redeem the correct amount of tokens", function () {
    it("Should allow Whale to redeem both tokens", async function () {
      // contract call
      console.log(
        "Swap contract can spend up to ",
        utils.formatEther((await usdfloat.allowance(owner.address, swapcontract.address)).toString()),
        "usdfloat"
      );
      console.log(
        "Swap contract can spend up to ",
        utils.formatEther((await eurfix.allowance(owner.address, swapcontract.address)).toString()),
        "EURFIX"
      );
      console.log(
        "Owner has ", 
        utils.formatEther(await dai.balanceOf(owner.address)),
        "DAI ")

      swapcontract.redeem(eurfix_amount,usdfloat_amount);
      console.log(
        "Owner has ", 
        utils.formatEther(await eurfix.balanceOf(owner.address)),
        "EURFIX and ", 
        utils.formatEther(await usdfloat.balanceOf(owner.address)), 
        "USDFLOAT");
      console.log(
        "Owner has ", 
        utils.formatEther(await dai.balanceOf(owner.address)),
        "DAI ")

    });
    it("Should not allow Whale to redeem both with uneven numbers", async function () {
      await expect(
        swapcontract.redeem(eurfix_amount.sub("1"),usdfloat_amount)
      ).to.be.revertedWith("Must exchange same amount of EURFIX and USDFLOAT");
    });
    it("Should allow person to one token at a time", async function () {
      await swapcontract.start_redeeming();
      await swapcontract.connect(owner).redeem_EURFIX(5);
    });
    it("Should calculate the correct EURFIX payout factor given a exchange rate", async function () {
      const exchange_rate = await swapcontract.getEUROPrice();
      console.log(
        "Payout by current exchange rate of",
        exchange_rate.toString() + "\n",
        (await swapcontract.calculate_EURFIX_payout(exchange_rate)).toString()
      );
      // change exchange rate
      const exchange_rate_new = exchange_rate.sub("1000");
      console.log(
        "Payout by current exchange rate of",
        exchange_rate_new.toString() + "\n",
        (await swapcontract.calculate_EURFIX_payout(exchange_rate_new)).toString()
      );

    });
  });

  const impersonateAddress = async (address) => {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });

    const signer = await ethers.provider.getSigner(address);
    signer.address = signer._address;

    return signer;
  }
  
  async function OccupyDAI(new_owner, transferAmount) {

    let dai = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', '0x6b175474e89094c44da98b954eedeac495271d0f');
    const whale = '0x04ad0703b9c14a85a02920964f389973e094e153';
    const whaleSigner = await impersonateAddress(whale);

    

    let balance = await dai.balanceOf(whale);
   /* console.log(
      "whale balance (before) ",
      utils.formatEther(balance)
    );*/

    balance = await dai.balanceOf(new_owner.address);
  /*  console.log(
      "our very own balance (before) ",
      utils.formatEther(balance)
    );*/

    dai = dai.connect(whaleSigner);

    await dai.transfer(new_owner.address, transferAmount);

    balance = await dai.balanceOf(new_owner.address);

    /*console.log(
      "our very own balance (after) ",
      utils.formatEther(balance)
    )*/

    return balance;


  }

});        