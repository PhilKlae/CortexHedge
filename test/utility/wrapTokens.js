const { expect } = require("chai")
const { waffle } = require("hardhat")
const { utils } = require("ethers");

describe("Wrap two ERC20 tokens", function () {
  let usdfloat;
  let eurfix;
  let adai;

  let eurosavings;
  let eurodebt;

  let tokenWrapper;

  let owner;
  let addr1;
  let addr2;
  let addrs;
  let initialSupply;

  beforeEach(async () => {
    // get accounts
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // define tokens
    initialSupply = utils.parseEther("1000"); // 1000

    // ingoing tokens
    const EURFIX = await ethers.getContractFactory("DAI");
    eurfix = await EURFIX.connect(owner).deploy(initialSupply);

    const USDFLOAT = await ethers.getContractFactory("DAI");
    usdfloat = await USDFLOAT.connect(owner).deploy(initialSupply);

    const ADAI = await ethers.getContractFactory("DAI");
    adai = await ADAI.connect(owner).deploy(initialSupply);


    // define wrapper contract
    TokenWrapper = await ethers.getContractFactory("tokenWrapper");
    tokenwrapper = await TokenWrapper.connect(owner).deploy(
      adai.address,
      eurfix.address,
      usdfloat.address
    );
    // outgoing tokens (grant minter role to wrapper contract!)
    const Eurosavings = await ethers.getContractFactory("EUROdebt");
    eurosavings = await Eurosavings.connect(addr1).deploy(tokenwrapper.address);

    const Eurodebt = await ethers.getContractFactory("EUROsavings");
    eurodebt = await Eurodebt.connect(addr1).deploy(tokenwrapper.address);

    // give outgoing address to tokenwrapper
    tokenwrapper.connect(owner).setMinterTokens(eurosavings.address, eurodebt.address);

    // grant allowances
    await adai.connect(owner).approve(tokenwrapper.address, initialSupply);
    await eurfix.connect(owner).approve(tokenwrapper.address, initialSupply);
  });
  describe("Deployment", function () {
    /*
    it("Should be able give allowance to tokenwrapper", async function () {
      // approve spending
      const adai_allowance = await adai.allowance(owner.address, tokenwrapper.address);
      const eurfix_allowance = await eurfix.allowance(owner.address, tokenwrapper.address);

      expect(adai_allowance).to.be.equal(initialSupply);
      expect(eurfix_allowance).to.be.equal(initialSupply);
    });
    it("Should be able mint aDai to deployer", async function () {
      owner_balance = await adai.connect(addr1).balanceOf(owner.address);
      console.log(
        "Owner owns this much adai",
        utils.formatEther(owner_balance.toString())
      );
      expect(owner_balance).to.be.equal(initialSupply);
    });
    it("Should be able to give minter role to tokenwrapper contract", async function () {
      const minter_role = await eurosavings.MINTER_ROLE();
      expect(await eurosavings.hasRole(minter_role, tokenwrapper.address)).to.be.true;
    });
    */
  });
  describe("Wrapping", function () {
    it("Should be able to wrapp aDai and eurfix for eursavings", async function () {
      // define tokens
      const adai_amount = utils.parseEther("100"); // 100
      const eurfix_amount = utils.parseEther("10"); // 100

      await tokenwrapper.connect(owner).
        wrapEUROsavings(adai_amount, eurfix_amount);
      
      const eurosavings_amount = await eurosavings.balanceOf(owner.address);  
      //console.log(
      //  "Owner owns this much adai",
      //  utils.formatEther(eurosavings_amount.toString())
      //);
      expect(eurosavings_amount).to.be.equal(utils.parseEther("100"))
    });
    it("Should be able to unwrapp eursavings for aDai and eurfix ", async function () {

      // define tokens
      const adai_amount_before = utils.parseEther("100"); // 100
      const eurfix_amount_before = utils.parseEther("10"); // 100

      // wrap tokens first 
      await tokenwrapper.connect(owner).
        wrapEUROsavings(adai_amount_before, eurfix_amount_before);
      const eurosavings_amount = await eurosavings.balanceOf(owner.address);

      console.log(
        "Balance of owner is",
        utils.formatEther(eurosavings_amount.toString())
        );

      // try to unwrapp the token now
      await eurosavings.connect(owner).approve(tokenwrapper.address, eurosavings_amount);
      console.log(
        "Allowance of wrapp contract is",
        utils.formatEther((await eurfix.allowance(owner.address, tokenwrapper.address)).toString())
        );
      console.log(
        "Balance of owner is",
        utils.formatEther(eurosavings_amount.toString())
        );
      
      adai.connect(owner).approve(tokenwrapper.address, initialSupply);
      eurfix.connect(owner).approve(tokenwrapper.address, initialSupply);

      await tokenwrapper.connect(owner).unwrapEUROsavings(eurosavings_amount);

      let adai_amount_after = await adai.balanceOf(owner.address); 
      let eurfix_amount_after = await eurfix.balanceOf(owner.address);   

      expect(adai_amount_after).to.be.equal(adai_amount_before);
      expect(eurfix_amount_after).to.be.equal(eurfix_amount_before);
      console.log(
        "Owner owns this much adai",
        utils.formatEther(adai_amount_after.toString()),
        utils.formatEther(eurfix_amount_after.toString())
      );
      
    });
  });
})

