const { expect } = require('chai');
const { utils } = require("ethers");

const ERC20 = artifacts.require('Stub_ERC20');
const YERC20 = artifacts.require('Stub_YERC20');


const CurveDeposit = artifacts.require('Stub_CurveFi_DepositY');
const CurveSwap = artifacts.require('Stub_CurveFi_SwapY');
const CurveLPToken = artifacts.require('Stub_CurveFi_LPTokenY');
const CurveCRVMinter = artifacts.require('Stub_CurveFi_Minter');
const CurveGauge = artifacts.require('Stub_CurveFi_Gauge');

const MoneyToCurve = artifacts.require('MoneyToCurve');

const decimals = {
    sEUR: 18,
    EURS: 2
}
const supplies = {
    sEUR: utils.parseUnits("1000000", unit = decimals.sEUR),
    EURS: utils.parseUnits("1000000", unit = decimals.EURS)
};
const deposits = {
    sEUR: utils.parseUnits("100", unit = decimals.sEUR),
    EURS: utils.parseUnits("100", unit = decimals.EURS)
}



contract('Integrate Curve.Fi into your defi', async([ owner, defiowner, user1, user2 ]) => {
    let sEUR;
    let EURS;

    let ysEUR;
    let yEURS;

    let curveLPToken;
    let curveSwap;
    let curveDeposit;

    let crvToken;
    let curveMinter;
    let curveGauge;

    let moneyToCurve;

    before(async() => {
        // Prepare stablecoins stubs
        sEUR = await ERC20.new({ from: owner });
        await sEUR.methods['initialize(string,string,uint8,uint256)']('sEUR', 'sEUR', 18, supplies.sEUR, { from: owner });

        EURS = await ERC20.new({ from: owner });
        await EURS.methods['initialize(string,string,uint8,uint256)']('EURS', 'EURS', 2, supplies.EURS, { from: owner });

        //Prepare Y-token wrappers
        ysEUR = await YERC20.new({ from: owner });
        await ysEUR.initialize(sEUR.address, 'ysEUR', 18, { from: owner });
        yEURS = await YERC20.new({ from: owner });
        await yEURS.initialize(EURS.address, 'yEURS', 2,{ from: owner });


        //Prepare stubs of Curve.Fi
        curveLPToken = await CurveLPToken.new({from:owner});
        await curveLPToken.methods['initialize()']({from:owner});

        curveSwap = await CurveSwap.new({ from: owner });
        await curveSwap.initialize(
            [ysEUR.address, yEURS.address],
            [sEUR.address, EURS.address],
            curveLPToken.address, 10, { from: owner });
        await curveLPToken.addMinter(curveSwap.address, {from:owner});

        curveDeposit = await CurveDeposit.new({ from: owner });
        await curveDeposit.initialize(
            [ysEUR.address, yEURS.address],
            [sEUR.address, EURS.address],
            curveSwap.address, curveLPToken.address, { from: owner });
        await curveLPToken.addMinter(curveDeposit.address, {from:owner});

        crvToken = await ERC20.new({ from: owner });
        await crvToken.methods['initialize(string,string,uint8,uint256)']('CRV', 'CRV', 18, 0, { from: owner });

        curveMinter = await CurveCRVMinter.new({ from: owner });
        await curveMinter.initialize(crvToken.address, { from: owner });
        await crvToken.addMinter(curveMinter.address, { from: owner });

        curveGauge = await CurveGauge.new({ from: owner });
        await curveGauge.initialize(curveLPToken.address, curveMinter.address, {from:owner});
        await crvToken.addMinter(curveGauge.address, { from: owner });


        //Main contract
        moneyToCurve = await MoneyToCurve.new({from:defiowner});
        await moneyToCurve.initialize({from:defiowner});
        await moneyToCurve.setup(curveDeposit.address, curveGauge.address, curveMinter.address, {from:defiowner});

        //Preliminary balances
        await sEUR.transfer(user1, utils.parseUnits("100", unit = decimals.sEUR), { from: owner });
        await EURS.transfer(user1, utils.parseUnits("100", unit = decimals.EURS), { from: owner });

        await sEUR.transfer(user2, utils.parseUnits("100", unit = decimals.sEUR), { from: owner });
        await EURS.transfer(user2, utils.parseUnits("100", unit = decimals.EURS), { from: owner });
    });

    describe('Deposit your money into Curve.Fi', () => {
        it('Deposit', async() => {
            await sEUR.approve(moneyToCurve.address, deposits.sEUR, {from:user1});
            await EURS.approve(moneyToCurve.address, deposits.EURS, {from:user1});

            let sEURBefore = await sEUR.balanceOf(user1);
            let EURSBefore = await EURS.balanceOf(user1);

            await moneyToCurve.multiStepDeposit(
                [deposits.sEUR, deposits.EURS], {from:user1});

                
            let sEURAfter = await sEUR.balanceOf(user1);
            let EURSAfter = await EURS.balanceOf(user1);

            expect(sEURBefore.sub(sEURAfter).toString(), "Not deposited sEUR").to.equal(deposits.sEUR.toString());
            expect(EURSBefore.sub(EURSAfter).toString(), "Not deposited EURS").to.equal(deposits.EURS.toString());

        });

        it('Funds are wrapped with Y-tokens', async() => {
            expect((await sEUR.balanceOf(ysEUR.address)).toString(), "sEUR not wrapped").to.equal(deposits.sEUR.toString());
            expect((await EURS.balanceOf(yEURS.address)).toString(), "EURS not wrapped").to.equal(deposits.EURS.toString());
        });

        it('Y-tokens are deposited to Curve.Fi Swap', async() => {
            expect((await ysEUR.balanceOf(curveSwap.address)).toString(), "YsEUR not deposited").to.equal(deposits.sEUR.toString());
            expect((await yEURS.balanceOf(curveSwap.address)).toString(), "YEURS not deposited").to.equal(deposits.EURS.toString());
        });

    });
    describe('Additional deposit to create extra liquidity', () => {
        it('Additional deposit', async() => {
            await sEUR.approve(moneyToCurve.address, deposits.sEUR, {from:user2});
            await EURS.approve(moneyToCurve.address, deposits.EURS, {from:user2});

            await moneyToCurve.multiStepDeposit(
                [deposits.sEUR, deposits.EURS], {from:user2});
        });
    });

    describe('Withdraw your money from Curve.Fi', () => {
        it('Withdraw', async() => {
            let sEURBefore = await sEUR.balanceOf(user1);
            let EURSBefore = await EURS.balanceOf(user1);

            //Should left less in a pool due to comissions
            await moneyToCurve.multiStepWithdraw(
//                [new BN("10000000000000000000"), 0, 0, 0],
                [deposits.sEUR, deposits.EURS],
                {from:user1});
                
            let sEURAfter = await sEUR.balanceOf(user1);
            let EURSAfter = await EURS.balanceOf(user1);
            //console.log(
            //    "Balances sEUR: before, after",
            //    sEURBefore.toString(),
            //    sEURAfter.toString(),
            //);
            expect(sEURAfter.sub(sEURBefore).toString(), "Not withdrawn sEUR").to.equal(deposits.sEUR.toString());
            expect(EURSAfter.sub(EURSBefore).toString(), "Not withdrawn EURS").to.equal(deposits.EURS.toString());


        });
    });
    describe('Can return the current value owned by the contract', () => {
        it('Can return the value of tokens per unit of LP tokens', async() => {
            const lpTokensOwned = await curveLPToken.balanceOf(moneyToCurve.address)
            amounts = await moneyToCurve.curveLPTokenBalanceToStableCoin(lpTokensOwned, curveLPToken.address, [ysEUR.address, yEURS.address]);
            console.log(utils.formatUnits(amounts[0].toString(), unit = 18)); // return value has 18 decimals
            console.log(utils.formatUnits(amounts[1].toString(), unit = 18)); // return value has 18 decimals
        });
        it('Can return the value of stable coins owned by the pool (in LP tokens)', async() => {
            const return_value = await moneyToCurve.getEuroValue();
            console.log(utils.formatUnits(return_value, unit = 18)); // return value has 18 decimals
        });
    });
});


