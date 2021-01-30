const { expect } = require("chai")
const { waffle } = require("hardhat")

describe("DerivedPriceOracle", function () {
  let derivedPriceOracle
  beforeEach(async () => {
    let DerivedPriceOracle = await ethers.getContractFactory("DerivedPriceOracle")
    derivedPriceOracle = await DerivedPriceOracle.deploy()
    await derivedPriceOracle.deployed()
  })

  it("Should be able to successfully get round data", async function () {
    console.log(await derivedPriceOracle.getDAIPrice())
    expect(await derivedPriceOracle.getDAIPrice()).not.be.null
    expect(await derivedPriceOracle.getEUROPrice()).not.be.null
  })
})

