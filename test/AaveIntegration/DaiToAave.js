const { expect } = require("chai");
const { waffle } = require("hardhat");


describe("DaiToAave functions", function () {
  
    
    let owner;
    let minter;
    let redeemer;
    let addrs;
    let DaiToAveFactory;
    let daiToAave;

    const whale = '0x04ad0703b9c14a85a02920964f389973e094e153';


    const impersonateAddress = async (address) => {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address],
      });
    
      const signer = await ethers.provider.getSigner(address);
      signer.address = signer._address;
      
      return signer;
    }

    beforeEach(async () => {
  
   
    });

    beforeEach('Set up accounts', async () => {
        // get addresses to interact
        [owner, minter, redeemer, ...addrs] = await ethers.getSigners();

        DaiToAveFactory = await ethers.getContractFactory("DaiToAdai");
    
        daiToAave = await DaiToAveFactory.deploy();
        
        
    });

    /*
    describe("Inheritance", function () {
      it("Can access the price oracles from Price Consumer Contract", async function () {
        expect(await hardhatSwapContract.getDAIPrice()).not.be.null;
      });
    });
    */
    describe("Basics ", function () {
      
      it("GetLendingPoolAdress ", async function () {        

        address = await daiToAave.connect(minter).GetLendingPoolAdress();

        console.log(address);

      });

      it("Transfer Dai ", async function () {

        let transferAmount = 5000;            
        balance = await OccupyDAI(owner,transferAmount);
        expect(balance).to.equal(ethers.utils.parseEther(""+transferAmount) );

   
      });


      it("Add Allowance ", async function () {
        
        let DaiAmount = 5000;    
        balance = await OccupyDAI(owner,DaiAmount);
        let lendAmount = 2500;

        ownerAave = daiToAave.connect(owner);

        pool = await daiToAave.GetLendingPoolAdress();
        //let principal = await ownerAave.GetPrincipalAmount();
        //console.log(principal);
        console.log("adding allowance");
        let dai = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', '0x6b175474e89094c44da98b954eedeac495271d0f');                
      
        await dai.connect(owner).approve(pool, ethers.utils.parseEther(""+lendAmount));
        allowance = await dai.allowance(owner.address,pool);
        //console.log("allowance is: " + allowance);
        expect (allowance).to.equal(ethers.utils.parseEther(""+lendAmount));
      //  await ownerAave.addAllowance(pool,ethers.utils.parseEther(""+lendAmount));
      
      });



      it("Deposit ", async function () {
        
        let DaiAmount = 5000;    
        balance = await OccupyDAI(owner,DaiAmount);
        let lendAmount = 2500;

        ownerAave = daiToAave.connect(owner);

        pool = await daiToAave.GetLendingPoolAdress();
        //let principal = await ownerAave.GetPrincipalAmount();
        //console.log(principal);
        console.log("adding allowance");
        let dai = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', '0x6b175474e89094c44da98b954eedeac495271d0f');                
        let adai = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', '0x363edC62b8236a0079c00320340485Ee0E7B17ae'); 

        await dai.connect(owner).approve(pool, ethers.utils.parseEther(""+lendAmount));
        allowance = await dai.allowance(daiToAave.address,pool);
        console.log("allowance is: " + allowance);
        console.log(pool);
        const lending_pool_address = await daiToAave.getLending();
        dai.transfer(daiToAave.address, lendAmount);
        console.log("lending pool address is", lending_pool_address);

        
        const s0 = await adai.totalSupply();

        console.log("total adai supply" ,s0.toString());

        let b1 = await dai.balanceOf(daiToAave.address);
        let b2 = await dai.balanceOf(owner.address);

        console.log("dai balance before", b1.toString());
        console.log("dai balance before", b2.toString());

        await daiToAave.connect(owner).deposit_new();
        
        b1 = await dai.balanceOf(daiToAave.address);
        b2 = await dai.balanceOf(owner.address);
        
        console.log("dai balance after", b1.toString());
        console.log("dai balance after", b2.toString());

        await daiToAave.connect(owner).withdraw_new();
        //await ownerAave.deposit (pool, dai.address , ethers.utils.parseEther(""+lendAmount));
        //expect (allowance).to.equal(ethers.utils.parseEther(""+lendAmount));
       
  
      });
      
    });

    async function OccupyDAI( new_owner , transferAmount){

      let dai = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', '0x6b175474e89094c44da98b954eedeac495271d0f');                

      const whaleSigner = await impersonateAddress(whale);        

      let balance = await dai.balanceOf(new_owner.address);
      /*console.log(
        "our very own balance (before) ",
        ethers.utils.formatEther(balance)
      ) */       
      
      dai = dai.connect(whaleSigner);                
      
      await dai.transfer(new_owner.address, ethers.utils.parseEther(""+transferAmount));            

      balance = await dai.balanceOf(new_owner.address);

      return balance;
      /*console.log(
        "our very own balance (after) ",
        ethers.utils.formatEther(balance)
      )   */    

    }

  });