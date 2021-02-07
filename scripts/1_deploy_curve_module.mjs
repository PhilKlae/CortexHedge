
export async function DeployCurve( addresses, owner ) {
  
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
    
    const supplies = {
      sEUR: ether.utils.parseUnits("1000000", unit = 2),
      EURS: ether.utils.parseUnits("1000000", unit = 18)
    };

    // Prepare stablecoins stubs
    const sEUR = await ERC20.new({ from: owner });
    await sEUR.methods['initialize(string,string,uint8,uint256)']('sEUR', 'sEUR', 18, supplies.sEUR, { from: owner });
    console.log(
      "sEUR address", 
      sEUR.address, 
      "@dev: use in UNISWAP pools \n"
    )
    
    addresses["sEUR"] = sEUR.address;

    const EURS = await ERC20.new({ from: owner });
    await EURS.methods['initialize(string,string,uint8,uint256)']('EURS', 'EURS', 2, supplies.EURS, { from: owner });
    console.log(
      "EURS address", 
      EURS.address, 
      "@dev: use in UNISWAP pools \n"
    )    

    addresses["EURS"] = sEUR.address;

    //Prepare Y-token wrappers
    const ysEUR = await YERC20.new({ from: owner });
    await ysEUR.initialize(sEUR.address, 'ysEUR', 18, { from: owner });
    const yEURS = await YERC20.new({ from: owner });
    await yEURS.initialize(EURS.address, 'yEURS', 2,{ from: owner });

    //Prepare stubs of Curve.Fi
    const curveLPToken = await CurveLPToken.new({from:owner});
    await curveLPToken.methods['initialize()']({from:owner});

    addresses["CurveLPToken"] = curveLPToken.address;

    const curveSwap = await CurveSwap.new({ from: owner });
    await curveSwap.initialize(
        [ysEUR.address, yEURS.address],
        [sEUR.address, EURS.address],
        curveLPToken.address, 10, { from: owner });
    await curveLPToken.addMinter(curveSwap.address, {from:owner});

    //addresses["CurveSwapPool"] = curveSwap.address;

    const curveDeposit = await CurveDeposit.new({ from: owner });
    await curveDeposit.initialize(
        [ysEUR.address, yEURS.address],
        [sEUR.address, EURS.address],
        curveSwap.address, curveLPToken.address, { from: owner });
    await curveLPToken.addMinter(curveDeposit.address, {from:owner});
    console.log(
      "curveDeposit address", 
      curveDeposit.address, 
      "@dev: use in investment module \n"
    )    
    
    const crvToken = await ERC20.new({ from: owner });
    await crvToken.methods['initialize(string,string,uint8,uint256)']('CRV', 'CRV', 18, 0, { from: owner });

    const curveMinter = await CurveCRVMinter.new({ from: owner });
    await curveMinter.initialize(crvToken.address, { from: owner });
    await crvToken.addMinter(curveMinter.address, { from: owner });
    console.log(
      "curveMinter address", 
      curveMinter.address, 
      "@dev: use in investment module \n"
    )    

    const curveGauge = await CurveGauge.new({ from: owner });
    await curveGauge.initialize(curveLPToken.address, curveMinter.address, {from:owner});
    await crvToken.addMinter(curveGauge.address, { from: owner });
    console.log(
      "curveGauge address", 
      curveGauge.address, 
      "@dev: use in investment module \n"
    )    


    moneyToCurve = await MoneyToCurve.new({from:owner});
    await moneyToCurve.initialize({from:owner});
    await moneyToCurve.setup(curveDeposit.address, curveGauge.address, curveMinter.address, {from:owner});

    addresses["moneyToCurve"] = moneyToCurve.address;

  }
