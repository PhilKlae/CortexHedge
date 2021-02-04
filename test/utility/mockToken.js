const { expect } = require("chai");


describe("Mock Dai contract", function () {
  let DAI;
  let hardhatDAI;

  let EUR;
  let hardhatEUR;

  let owner;
  let totalSupply = 5000;

  beforeEach(async () => {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    DAI = await ethers.getContractFactory("DAI");
    hardhatDAI = await DAI.deploy(totalSupply);

    EUR = await ethers.getContractFactory("EUR");
    hardhatEUR = await EUR.deploy(totalSupply);

    await hardhatDAI.deployed();
    await hardhatEUR.deployed();
  })

  describe("Deployment", function() {
    it("Should give the minter DAI tokens", async function() {
      // Deployer address should receive the MINTER_ROLE
      const ownerBalance = await hardhatDAI.balanceOf(owner.address);
      expect(await hardhatDAI.totalSupply()).to.equal(ownerBalance);
    });

    it("Should give the minter EUR tokens", async function() {
      // Deployer address should receive the MINTER_ROLE
      const ownerBalance = await hardhatEUR.balanceOf(owner.address);
      expect(await hardhatEUR.totalSupply()).to.equal(ownerBalance);
    });
  });
});
