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


      it("Lend Dai ", async function () {
        
        let DaiAmount = 5000;    
        balance = await OccupyDAI(owner,DaiAmount);
        let lendAmount = 2500;

        ownerAave = daiToAave.connect(owner);

        pool = await ownerAave.GetLendingPoolAdress();
        //let principal = await ownerAave.GetPrincipalAmount();
        //console.log(principal);
        await ownerAave.deposit(pool,'0x6B175474E89094C44Da98b954EedeAC495271d0F',ethers.utils.parseEther(""+lendAmount));

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