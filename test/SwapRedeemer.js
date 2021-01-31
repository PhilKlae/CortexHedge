const { expect } = require("chai");
const { waffle } = require("hardhat")

describe("Swap Redeemer", function () {
  let SwapRedeemer;
  let hardhatSwapRedeemer;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async () => {
    SwapRedeemer = await ethers.getContractFactory("SwapRedeemer");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    hardhatSwapRedeemer = await SwapRedeemer.deploy();
    await hardhatSwapRedeemer.deployed();
  })

  describe("Deployment", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    // If the callback function is async, Mocha will `await` it.
    it("Should set the right owner", async function () {
      // Expect receives a value, and wraps it in an Assertion object. These
      // objects have a lot of utility methods to assert values.

      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      expect(await hardhatSwapRedeemer.owner()).to.equal(owner.address);
    });
    // If the callback function is async, Mocha will `await` it.
    it("Should set other token addresses", async function () {
      // Expect receives a value, and wraps it in an Assertion object. These
      // objects have a lot of utility methods to assert values.

      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
    });

  });

  describe("Inheritance", function () {
    it("Can access the price oracles from Price Consumer Contract", async function () {
      //console.log(await hardhatSwapRedeemer.getDAIPrice());
      expect(await hardhatSwapRedeemer.getDAIPrice()).not.be.null;
    });
  });

  describe("Savings Period", function () {
    it("Can start the savings period", async function () {
      await hardhatSwapRedeemer.start_saving();
      const exchange_rate_start = await hardhatSwapRedeemer.exchange_rate_start();
      expect(exchange_rate_start).not.be.null;
      expect(exchange_rate_start).to.equal(await hardhatSwapRedeemer.getEUROPrice());
    });
  });

});


