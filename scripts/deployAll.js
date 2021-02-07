const { expect } = require("ethers");
//const { hexStripZeros } = require("ethers/lib/utils");
const hre = require("hardhat");
const routerJson = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const ether = require("@openzeppelin/test-helpers/src/ether");



async function main() {
  accounts = await ethers.getSigners()
  let owner = accounts[0];
  let launcher2 = accounts[1];
  let launcher3 = accounts[2];

  console.log("owner: " + owner.address);
  console.log("selected net: " + hre.network.name);

  let addressDict = {};

  if (hre.network.name == "hardhat") { //mainnet fork or local net 

    //Mainnet
    addressDict["DAI"] = "0x6b175474e89094c44da98b954eedeac495271d0f";
    addressDict["aDAI"] = "0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d";
    addressDict["AaveLendingPoolProvider"] = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";
    addressDict["Chainlink"] = "0xb49f677943BC038e9857d61E7d053CaA2C1734C1";
    addressDict["UniFactory"] = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";//v2
    addressDict["UniRouter"] = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    addressDict["Weth"] = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";


  } else if (hre.network.name == "Kovan") {

    //KovanAddresses
    addressDict["DAI"] = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
    addressDict["aDAI"] = "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8";
    addressDict["AaveLendingPoolProvider"] = "0x88757f2f99175387ab4c6a4b3067c77a695b0349";
    addressDict["Chainlink"] = "0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13";//0xb49f677943BC038e9857d61E7d053CaA2C1734C1 mainnet
    addressDict["UniFactory"] = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; 
    addressDict["UniRouter"] = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    addressDict["Weth"] = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";

  }

  //deploys EURs, sEUR, MoneyToCurve
  await DeployCurve(addressDict, owner);

  //deploy uniswap shizzle

  //deploy uniswap pool seur DAI/

  //deploy uniswap pool eurs DAI/

  //deploy uniswap helper
  await DeployUniswap(addressDict, owner);

  //deploys swapper 
  await DeploySwapper(addressDict, owner,launcher2, launcher3);

  return addressDict;
}

async function DeployCurve( addresses, owner ) {
  
  console.log(
    "Deploying contracts with the account:",
    owner.address
  );
  
  console.log("Account balance:", (await owner.getBalance()).toString());

  const { BN } = require('@openzeppelin/test-helpers');
  
  const ERC20 = artifacts.require('Stub_ERC20');
  const YERC20 = artifacts.require('Stub_YERC20');
  
  const CurveDeposit = artifacts.require('Stub_CurveFi_DepositY');
  const CurveSwap = artifacts.require('Stub_CurveFi_SwapY');
  const CurveLPToken = artifacts.require('Stub_CurveFi_LPTokenY');
  const CurveCRVMinter = artifacts.require('Stub_CurveFi_Minter');
  const CurveGauge = artifacts.require('Stub_CurveFi_Gauge');
  const MoneyToCurve = artifacts.require('MoneyToCurve');
  
  const supplies = {
    sEUR: ethers.utils.parseUnits("1000000", unit = 2),
    EURS: ethers.utils.parseUnits("1000000", unit = 18)
  };

  // Prepare stablecoins stubs
  const sEUR = await ERC20.new({ from: owner.address });
  await sEUR.methods['initialize(string,string,uint8,uint256)']('sEUR', 'sEUR', 18, supplies.sEUR, { from: owner.address });
  console.log(
    "sEUR address", 
    sEUR.address, 
    "@dev: use in UNISWAP pools \n"
  )
  
  addresses["sEUR"] = sEUR.address;

  const EURS = await ERC20.new({ from: owner.address });
  await EURS.methods['initialize(string,string,uint8,uint256)']('EURS', 'EURS', 2, supplies.EURS, { from: owner.address });
  console.log(
    "EURS address", 
    EURS.address, 
    "@dev: use in UNISWAP pools \n"
  )    

  addresses["EURs"] = EURS.address;

  //Prepare Y-token wrappers
  const ysEUR = await YERC20.new({ from: owner.address });
  await ysEUR.initialize(sEUR.address, 'ysEUR', 18, { from: owner.address });
  const yEURS = await YERC20.new({ from: owner.address });
  await yEURS.initialize(EURS.address, 'yEURS', 2,{ from: owner.address });

  //Prepare stubs of Curve.Fi
  const curveLPToken = await CurveLPToken.new({from: owner.address});
  await curveLPToken.methods['initialize()']({from: owner.address});

  //addresses["CurveLPToken"] = curveLPToken.address;

  const curveSwap = await CurveSwap.new({ from: owner.address });
  await curveSwap.initialize(
      [ysEUR.address, yEURS.address],
      [sEUR.address, EURS.address],
      curveLPToken.address, 10, { from: owner.address });
  await curveLPToken.addMinter(curveSwap.address, {from: owner.address});

  //addresses["CurveSwapPool"] = curveSwap.address;

  const curveDeposit = await CurveDeposit.new({ from: owner.address });
  await curveDeposit.initialize(
      [ysEUR.address, yEURS.address],
      [sEUR.address, EURS.address],
      curveSwap.address, curveLPToken.address, { from: owner.address });
  await curveLPToken.addMinter(curveDeposit.address, {from: owner.address});
  console.log(
    "curveDeposit address", 
    curveDeposit.address, 
    "@dev: use in investment module \n"
  )    
  
  const crvToken = await ERC20.new({ from: owner.address });
  await crvToken.methods['initialize(string,string,uint8,uint256)']('CRV', 'CRV', 18, 0, { from: owner.address });

  const curveMinter = await CurveCRVMinter.new({ from: owner.address });
  await curveMinter.initialize(crvToken.address, { from: owner.address });
  await crvToken.addMinter(curveMinter.address, { from: owner.address });
  console.log(
    "curveMinter address", 
    curveMinter.address, 
    "@dev: use in investment module \n"
  )    

  const curveGauge = await CurveGauge.new({ from: owner.address });
  await curveGauge.initialize(curveLPToken.address, curveMinter.address, {from: owner.address});
  await crvToken.addMinter(curveGauge.address, { from: owner.address });
  console.log(
    "curveGauge address", 
    curveGauge.address, 
    "@dev: use in investment module \n"
  )    


  moneyToCurve = await MoneyToCurve.new({from: owner.address});
  await moneyToCurve.initialize({from: owner.address});
  await moneyToCurve.setup(curveDeposit.address, curveGauge.address, curveMinter.address, {from: owner.address});

  addresses["moneyToCurve"] = moneyToCurve.address;

}

async function DeploySwapper( addresses, owner , launcher2, launcher3) {  
  
  console.log(addresses);
  let checkpoint = 1;

  console.log("Account balance:", (await owner.getBalance()).toString());

  // main swap contract
  console.log("checkpoint " + checkpoint);
  checkpoint ++;

  const SwapContract = await ethers.getContractFactory("SwapContract");

  console.log("checkpoint " + checkpoint);
  checkpoint ++;

  const hardhatSwapContract = await SwapContract.connect(owner).deploy(
   addresses["moneyToCurve"],
   addresses["EURs"],
   addresses["sEUR"],
   addresses["UniswapConnectorSeur"],
   addresses["UniswapConnectorEurS"] );

   console.log("checkpoint " + checkpoint);
   checkpoint ++;

  await hardhatSwapContract.deployed();

  console.log("checkpoint " + checkpoint);
  checkpoint ++;
  
  addresses["Main"] = hardhatSwapContract.address;

  // launch auxillary tokens and connect to main contract
  const EURFIX = await ethers.getContractFactory("EURFIX");

  console.log("checkpoint " + checkpoint);
  checkpoint ++;

  const hardhatEURFIX = await EURFIX.connect(launcher2).deploy(hardhatSwapContract.address);
  await hardhatEURFIX.deployed();

  console.log("checkpoint " + checkpoint);
  checkpoint ++;
  
  addresses["EURFIX"] = hardhatEURFIX.address;

  const USDFLOAT = await ethers.getContractFactory("USDFLOAT");

  console.log("checkpoint " + checkpoint);
  checkpoint ++;

  const hardhatUSDFLOAT = await USDFLOAT.connect(launcher3).deploy(hardhatSwapContract.address);

  console.log("checkpoint " + checkpoint);
  checkpoint ++;

  await hardhatUSDFLOAT.deployed();

  console.log("checkpoint " + checkpoint);
  checkpoint ++;

  addresses["USDFLOAT"] = hardhatUSDFLOAT.address;

  // give derivative contract address to main address
  await hardhatSwapContract.set_EURFIX_address(hardhatEURFIX.address);
  console.log("checkpoint " + checkpoint);
  checkpoint ++;
  await hardhatSwapContract.set_USDFLOAT_address(hardhatUSDFLOAT.address);
  console.log("checkpoint " + checkpoint);
  checkpoint ++;
  await hardhatSwapContract.set_Dai_address(addresses["DAI"]);
  console.log("checkpoint " + checkpoint);
  checkpoint ++;
}

async function DeployUniswap(addresses, owner){
  const amountA = 1200000;
  const amountB = 1000000;
  
  await OccupyDAI(owner,amountA * 2);

  let checkpoint = 1
  
  
  let hardhatDAI = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', addresses["DAI"]);                
  

  
  let hardhatEURs = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', addresses["EURs"]);                
  let hardhatsEUR = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', addresses["sEUR"]);                


  let uniConnector;
  let hardhatUniConnector;
  
  

  router = new ethers.ContractFactory(routerJson.abi, routerJson.bytecode, owner);
  hardhatRouter = await router.attach(addresses["UniRouter"]);
  
 
  uniConnector = await ethers.getContractFactory("UniswapConnector");



  //console.log( hardhatEURs.address  );
  
  //EURs pool
  hardhatUniConnector = await uniConnector.deploy(
    addresses["UniFactory"],
    addresses["UniRouter"],
    hardhatDAI.address,
    hardhatEURs.address
  );


  await hardhatUniConnector.deployed();
  addresses["UniswapConnectorEurS"] = hardhatUniConnector.address;

//sEUR pool
  hardhatUniConnectorSeur = await uniConnector.deploy(
    addresses["UniFactory"],
    addresses["UniRouter"],
    hardhatDAI.address,
    hardhatsEUR.address
  );


  await hardhatUniConnectorSeur.deployed();
  addresses["UniswapConnectorSeur"] = hardhatUniConnectorSeur.address;

  /*
   * Add liquidity
  */ 

  
  /*console.log((await hardhatDAI.balanceOf(owner.address)).toNumber() );
  console.log((await hardhatEURs.balanceOf(owner.address)).toNumber() );
*/


  const deadline = Math.floor(Date.now() / 1000) + 120;

/*  console.log("checkpoint " + checkpoint);
  checkpoint ++;

  console.log( await hardhatRouter.factory());
*/

    console.log(addresses);

    console.log("checkpoint " + checkpoint);
    checkpoint ++;

  await hardhatDAI.connect(owner).approve(addresses["UniRouter"], amountA);

  await hardhatEURs.connect(owner).approve(addresses["UniRouter"], amountB);

  await hardhatRouter.addLiquidity(
    hardhatDAI.address,
    hardhatEURs.address,
    amountA,
    amountB,
    0,
    0,
    owner.address,
    deadline
  );

  console.log("checkpoint " + checkpoint);
  checkpoint ++;
  
  await hardhatDAI.connect(owner).approve(addresses["UniRouter"], amountA);

  await hardhatsEUR.connect(owner).approve(addresses["UniRouter"], amountB);

  await hardhatRouter.addLiquidity(
    hardhatDAI.address,
    hardhatsEUR.address,
    amountA,
    amountB,
    0,
    0,
    owner.address,
    deadline
  );

  console.log("checkpoint " + checkpoint);
  checkpoint ++;

 const info = await hardhatUniConnector.pairInfo(hardhatDAI.address, hardhatEURs.address);

  console.log(info[0].toNumber())
}


const impersonateAddress = async (address) => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });

  const signer = await ethers.provider.getSigner(address);
  signer.address = signer._address;

  return signer;
}

async function OccupyDAI(new_owner, transferAmount) {

  let dai = await ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', '0x6b175474e89094c44da98b954eedeac495271d0f');
  const whale = '0x04ad0703b9c14a85a02920964f389973e094e153';
  const whaleSigner = await impersonateAddress(whale);



  let balance = await dai.balanceOf(whale);
  /* console.log(
     "whale balance (before) ",
     utils.formatEther(balance)
   );*/

  balance = await dai.balanceOf(new_owner.address);
  /*  console.log(
      "our very own balance (before) ",
      utils.formatEther(balance)
    );*/

  dai = dai.connect(whaleSigner);

  await dai.transfer(new_owner.address, transferAmount);

  balance = await dai.balanceOf(new_owner.address);

  /*console.log(
    "our very own balance (after) ",
    utils.formatEther(balance)
  )*/

  return balance;


}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
