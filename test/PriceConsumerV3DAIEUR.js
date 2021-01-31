const { expect } = require("chai")
const { waffle } = require("hardhat")

describe("PriceConsumerV3DAIEUR", function () {
  let priceConsumerV3DAIEUR
  beforeEach(async () => {
    let PriceConsumerV3DAIEUR = await ethers.getContractFactory("PriceConsumerV3DAIEUR")
    priceConsumerV3DAIEUR = await PriceConsumerV3DAIEUR.deploy()
    await priceConsumerV3DAIEUR.deployed()
  })

  it("Should be able to successfully get round data", async function () {
    console.log(await priceConsumerV3DAIEUR.getDAIPrice())
    expect(await priceConsumerV3DAIEUR.getDAIPrice()).not.be.null
    expect(await priceConsumerV3DAIEUR.getEUROPrice()).not.be.null
  })
})

