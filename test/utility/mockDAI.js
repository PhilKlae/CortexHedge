const { expect } = require("chai");


describe("Mock Dai contract", function () {
  let DAI;
  let hardhatDAI;
  let owner;
  let totalSupply = 5000;

  beforeEach(async () => {
    DAI = await ethers.getContractFactory("DAI");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    DAI = await ethers.getContractFactory("DAI");
    hardhatDAI = await DAI.deploy(totalSupply);
    await hardhatDAI.deployed();
  })

  describe("Deployment", function() {
    it("Should give the minter some tokens", async function() {
      // Deployer address should receive the MINTER_ROLE
      const ownerBalance = await hardhatDAI.balanceOf(owner.address);
      expect(await hardhatDAI.totalSupply()).to.equal(ownerBalance);
    });
  });
});