const { expect } = require("chai");
const { waffle } = require("hardhat");


describe("DaiToAave functions", function () {
  
    
    let owner;
    let minter;
    let redeemer;
    let addrs;

    beforeEach(async () => {
  
   
    });

    beforeEach('Set up accounts', async () => {
        // get addresses to interact
        [owner, minter, redeemer, ...addrs] = await ethers.getSigners();
    });

    /*
    describe("Inheritance", function () {
      it("Can access the price oracles from Price Consumer Contract", async function () {
        expect(await hardhatSwapContract.getDAIPrice()).not.be.null;
      });
    });
    */
    describe("Get LendingPoolAdress", function () {
      it("GetLendingPoolAdress ", async function () {

        const [owner] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("DaiToAdai");
    
        const hardhatToken = await Token.deploy();
        
        address = await hardhatToken.connect(minter).GetLendingPoolAdress();

        console.log(address);

      });
    });
  

  
  });
