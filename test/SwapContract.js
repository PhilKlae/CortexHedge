const { expect } = require("chai");
const { waffle } = require("hardhat")

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
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async () => {

    // main swap contract
    SwapContract = await ethers.getContractFactory("SwapContract");
    hardhatSwapContract = await SwapContract.deploy();
    await hardhatSwapContract.deployed();
  
    // get addresses to interact
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // launch auxillary tokens and connect to main contract
    EURFIX = await ethers.getContractFactory("EURFIX");
    hardhatEURFIX = await EURFIX.deploy(hardhatSwapContract.address);
    await hardhatEURFIX.deployed();

    USDFLOAT = await ethers.getContractFactory("USDFLOAT");
    hardhatUSDFLOAT = await USDFLOAT.deploy(hardhatSwapContract.address);
    await hardhatUSDFLOAT.deployed();

    DAI = await ethers.getContractFactory("mockDAI");
    hardhatDAI = await DAI.deploy(50000);
    await hardhatDAI.deployed();

    // give derivative contract address to main address
    await hardhatSwapContract.set_EURFIX_address(hardhatEURFIX.address);
    await hardhatSwapContract.set_USDFLOAT_address(hardhatUSDFLOAT.address);
    await hardhatSwapContract.set_Dai_address(hardhatDAI.address);

  })

  describe("Deployment", function () {
    it("Should give Swap Contract the MINTER_ROLE", async function() {
      // Deployer address should receive the MINTER_ROLE
      const minter_role = await hardhatEURFIX.MINTER_ROLE();
      expect(await hardhatEURFIX.hasRole(minter_role, hardhatSwapContract.address)).to.be.true;
    });
    it("Should set the correct (EURFIX) address in SwapContract ", async function () {
      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      expect(await hardhatSwapContract.EURFIX_address()).to.equal(hardhatEURFIX.address);
    });

  });

});


