const { expect } = require("chai");
const { waffle } = require("hardhat")

describe("Swap Contract", function () {
  let SwapContract;
  let hardhatSwapContract;


  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async () => {

    // main swap contract
    SwapContract = await ethers.getContractFactory("SwapContract");
    hardhatSwapContract = await SwapContract.deploy();
    await hardhatSwapContract.deployed();
    const SwapContractAddress = hardhatSwapContract.address;

  
    // get addresses to interact
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();


  })

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      expect(await hardhatSwapContract.owner()).to.equal(owner.address);
    });
    it("Sucessfully connect contracts", async function () {
      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      expect(await hardhatSwapContract.owner()).to.equal(owner.address);
    });

  });

  describe("Inheritance", function () {
    it("Can access the price oracles from Price Consumer Contract", async function () {
      //console.log(await hardhatSwapContract.getDAIPrice());
      expect(await hardhatSwapContract.getDAIPrice()).not.be.null;
    });
  });

  describe("Savings Period", function () {
    it("Can start the savings period", async function () {
      await hardhatSwapContract.start_saving();
      const exchange_rate_start = await hardhatSwapContract.exchange_rate_start();
      expect(exchange_rate_start).not.be.null;
      expect(exchange_rate_start).to.equal(await hardhatSwapContract.getEUROPrice());
    });
  });

});


