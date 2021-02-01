const { expect } = require("chai");


describe("Euro fixed", function () {
  let EURFIX;
  let hardhatEURFIX;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async () => {
    EURFIX = await ethers.getContractFactory("EURFIX");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    hardhatEURFIX = await EURFIX.deploy(owner.address);
    await hardhatEURFIX.deployed();
  })

  describe("Role governance", function() {
    it("Should give deploying contract the MINTER_ROLE", async function() {
      // Deployer address should receive the MINTER_ROLE
      const minter_role = await hardhatEURFIX.MINTER_ROLE();
      expect(await hardhatEURFIX.hasRole(minter_role, owner.address)).to.be.true;
    });
  });
});