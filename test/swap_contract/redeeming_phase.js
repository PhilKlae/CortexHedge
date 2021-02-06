const { expect } = require("chai");
const { waffle } = require("hardhat");
const { utils } = require("ethers");

describe("Swap Contract", function () {
  let swapcontract;

  let eurfix;
  let usdfloat;
  let dai;

  let owner;
  let saver;
  let debtor;
  let addrs;

  let eurfix_amount;
  let usdfloat_amount;

  // test data. Use BigNumber to avoid overflow
  const fullAmount = utils.parseEther("1000"); // 1000
  const approvedAmount = utils.parseEther("200"); // 100
  const initialContractBalance = utils.parseEther("50"); // 100

  beforeEach('Set up accounts', async () => {
    // get addresses to interact
    [owner, saver, debtor, ...addrs] = await ethers.getSigners();

    await OccupyDAI(owner, fullAmount);

  });

  beforeEach('Deploy Contracts', async () => {
    // main swap contract
    const Swapcontract = await ethers.getContractFactory("SwapContract");
    swapcontract = await Swapcontract.connect(owner).deploy();
    await swapcontract.deployed();
    // launch auxillary tokens and connect to main contract
    const EURFIX = await ethers.getContractFactory("EURFIX");
    eurfix = await EURFIX.connect(saver).deploy(swapcontract.address);
    await eurfix.deployed();

    const Usdfloat = await ethers.getContractFactory("USDFLOAT");
    usdfloat = await Usdfloat.connect(debtor).deploy(swapcontract.address);
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
    await swapcontract.connect(owner).invest(approvedAmount);
    eurfix_amount = await eurfix.balanceOf(owner.address);
    usdfloat_amount = await usdfloat.balanceOf(owner.address);
    //await dai.transfer(swapcontract.address, 5000000); // simulate some interest earned
  });
  beforeEach('Give allowance to burn EURFIX/usdfloat', async () => {
    // send some initial Dai to the contract
    await usdfloat.connect(owner).approve(swapcontract.address, approvedAmount.div(2));
    await eurfix.connect(owner).approve(swapcontract.address, approvedAmount.div(2));
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
      expect(principal_balance).to.equal(initialContractBalance.add(approvedAmount));

    });
    it("Should change the phase after start_redeeming() is called", async function () {
      const old_phase = await swapcontract.current_phase();
      //console.log("Before call the phase is", old_phase.toString());
      expect(old_phase).to.equal(1);

      await swapcontract.start_redeeming();

      const new_phase = await swapcontract.current_phase();
      //console.log("Before call the phase is", (await new_phase).toString());
      expect(new_phase).to.equal(2);
    });
  });
  describe("Should allow to redeem tokens", function () {
    it("Should allow Whale to redeem both tokens", async function () {
      // contract call
      /*
      console.log(
        "Swap contract can spend up to ",
        utils.formatEther((await usdfloat.allowance(owner.address, swapcontract.address)).toString()),
        "USDFLOAT"
      );
      console.log(
        "Swap contract can spend up to ",
        utils.formatEther((await eurfix.allowance(owner.address, swapcontract.address)).toString()),
        "EURFIX"
      );
      console.log(
        "Owner has ",
        utils.formatEther(await eurfix.balanceOf(owner.address)),
        "EURFIX ")
      console.log(
        "Owner has ",
        utils.formatEther(await usdfloat.balanceOf(owner.address)),
        "USDFLOAT ")
      */
      console.log("This does not work with forks since aDAI balance returns 0");
      await swapcontract.redeem(eurfix_amount, usdfloat_amount);
      /*
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
      */
    });
    it("Should not allow Whale to redeem both with uneven numbers", async function () {
      await expect(
        swapcontract.redeem(eurfix_amount.sub("1"), usdfloat_amount)
      ).to.be.revertedWith("Must exchange same amount of EURFIX and USDFLOAT");
    });
    it("Should allow person to redeem EURFIX at time", async function () {
      await swapcontract.start_redeeming();
      const dai_balance_saver_before = await dai.balanceOf(saver.address);
      await eurfix.connect(owner).transfer(saver.address, eurfix_amount);
      /*console.log(
        "Swap has total of ",
        utils.formatEther((await dai.balanceOf(swapcontract.address)).toString()),
        "dai"
      );*/
      await eurfix.connect(saver).approve(swapcontract.address, eurfix_amount);
      await swapcontract.connect(saver).redeem_EURFIX(eurfix_amount);
      
      const dai_balance_saver_after = await dai.balanceOf(saver.address);
      expect(dai_balance_saver_after).to.be.above(dai_balance_saver_before);
      /*console.log(
        "Saver has total of  ",
        utils.formatEther(dai_balance_saver_after),
        "dai"
      );*/
      //console.log(dai_balance_saver.toString());
      //console.log(eurfix_amount.toString());
      expect(dai_balance_saver_after).to.be.at.least(eurfix_amount);
    });
    it("Should allow person to redeem USDFLOAT at time", async function () {
      await swapcontract.start_redeeming();
      const dai_balance_saver_before = await dai.balanceOf(saver.address);
      await usdfloat.connect(owner).transfer(saver.address, usdfloat_amount);

      await usdfloat.connect(saver).approve(swapcontract.address, usdfloat_amount);
      await swapcontract.connect(saver).redeem_USDFLOAT(usdfloat_amount);
      
      const dai_balance_saver_after = await dai.balanceOf(saver.address);
      expect(dai_balance_saver_after).to.be.above(dai_balance_saver_before);
      expect(dai_balance_saver_after).to.be.at.least(usdfloat_amount);
    });
  });
  describe("Should calculate correct payout factors", function () {
    it("Should calculate the correct EURFIX payout factor given no change of exchange rate", async function () {
      const exchange_rate = await swapcontract.getEUROPrice();
      //console.log(
      //  "Payout factor by current exchange rate of",
      //  utils.formatUnits(
      //    (exchange_rate).toString(),
      //    unit = 8),
      //  "is",
      //  utils.formatUnits(
      //    (await swapcontract.calculate_EURFIX_payout(exchange_rate)).toString(),
      //    unit = 8)
      //);
      const EURFIX_payout_factor = await swapcontract.calculate_EURFIX_payout(exchange_rate);
      //console.log(utils.parseUnits("1", unit=8));
      //console.log(payout_factor);
      expect(EURFIX_payout_factor).to.be.equal(utils.parseUnits("1", unit=8));
    });
    it("Should calculate the correct EURFIX payout factor given a change of exchange rate", async function () {
      const exchange_rate = await swapcontract.getEUROPrice();
      const new_exchange_rate = exchange_rate.mul("105").div("100"); // EURUSD increases by 5%
      //console.log(
      //  "Payout factor by current exchange rate of",
      //  utils.formatUnits(
      //    (exchange_rate).toString(),
      //    unit = 8),
      //  "is",
      //  utils.formatUnits(
      //    (await swapcontract.calculate_EURFIX_payout(exchange_rate)).toString(),
      //    unit = 8)
      //);
      const EURFIX_payout_factor = await swapcontract.calculate_EURFIX_payout(new_exchange_rate);
      //console.log(utils.parseUnits("1", unit=8));
      //console.log(payout_factor);
      expect(EURFIX_payout_factor).to.be.equal(utils.parseUnits("15", unit=7));
    });
    it("Should calculate the correct USDFLOAT payout factor given no change of exchange rate", async function () {
      const exchange_rate = await swapcontract.getEUROPrice();
      //console.log(
      //  "Payout factor by current exchange rate of",
      //  utils.formatUnits(
      //    (exchange_rate).toString(),
      //    unit = 8),
      //  "is",
      //  utils.formatUnits(
      //    (await swapcontract.calculate_EURFIX_payout(exchange_rate)).toString(),
      //    unit = 8)
      //);
      const USDFLOAT_payout_factor = await swapcontract.calculate_USDFLOAT_payout(exchange_rate);
      //console.log(utils.parseUnits("1", unit=8));
      //console.log(payout_factor);
      expect(USDFLOAT_payout_factor).to.be.equal(utils.parseUnits("1", unit=8));
    });
    it("Should calculate the correct USDFLOAT payout factor given a change of exchange rate", async function () {
      const exchange_rate = await swapcontract.getEUROPrice();
      const new_exchange_rate = exchange_rate.mul("105").div("100"); // EURUSD increases by 5%
      //console.log(
      //  "Payout factor by current exchange rate of",
      //  utils.formatUnits(
      //    (exchange_rate).toString(),
      //    unit = 8),
      //  "is",
      //  utils.formatUnits(
      //    (await swapcontract.calculate_EURFIX_payout(exchange_rate)).toString(),
      //    unit = 8)
      //);
      const USDFLOAT_payout_factor = await swapcontract.calculate_USDFLOAT_payout(new_exchange_rate);
      //console.log(utils.parseUnits("1", unit=8));
      //console.log(payout_factor);
      expect(USDFLOAT_payout_factor).to.be.equal(utils.parseUnits("5", unit=7));
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