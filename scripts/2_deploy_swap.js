async function main() {

    const [deployer] = await ethers.getSigners();
  
    console.log(
      "Deploying contracts with the account:",
      deployer.address
    );
    
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    // main swap contract
    const SwapContract = await ethers.getContractFactory("SwapContract");
    const hardhatSwapContract = await SwapContract.connect(owner).deploy();
    await hardhatSwapContract.deployed();

    // launch auxillary tokens and connect to main contract
    const EURFIX = await ethers.getContractFactory("EURFIX");
    const hardhatEURFIX = await EURFIX.connect(minter).deploy(hardhatSwapContract.address);
    await hardhatEURFIX.deployed();

    const USDFLOAT = await ethers.getContractFactory("USDFLOAT");
    const hardhatUSDFLOAT = await USDFLOAT.connect(redeemer).deploy(hardhatSwapContract.address);
    await hardhatUSDFLOAT.deployed();

    const DAI = await ethers.getContractFactory("DAI");
    const hardhatDAI = await DAI.connect(owner).deploy(totalDAISupply);
    await hardhatDAI.deployed();

    // give derivative contract address to main address
    await hardhatSwapContract.set_EURFIX_address(hardhatEURFIX.address);
    await hardhatSwapContract.set_USDFLOAT_address(hardhatUSDFLOAT.address);
    await hardhatSwapContract.set_Dai_address(hardhatDAI.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
  });