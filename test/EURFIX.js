const { expect } = require("chai");

describe("Test functioning of the ERCPresetMinterPauser tokens", function() {
  it("Should give deploying contract the MINTER_ROLE", async function() {
    const owner = await ethers.getSigners();
    const EURFIX = await ethers.getContractFactory("EURFIX");

    const hardhatEURFIX = await EURFIX.deploy(owner.address);

    // Deployer address should receive the MINTER_ROLE
    expect(await hardhatEURFIX.hasRole(hardhatEURFIX.MINTER_ROLE(), owner.address)).to.be.true;
  });
});