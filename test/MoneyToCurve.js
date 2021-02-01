const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC20 = artifacts.require('Stub_ERC20');
const YERC20 = artifacts.require('Stub_YERC20');


const CurveDeposit = artifacts.require('Stub_CurveFi_DepositY');
const CurveSwap = artifacts.require('Stub_CurveFi_SwapY');
const CurveLPToken = artifacts.require('Stub_CurveFi_LPTokenY');
const CurveCRVMinter = artifacts.require('Stub_CurveFi_Minter');
const CurveGauge = artifacts.require('Stub_CurveFi_Gauge');

const MoneyToCurve = artifacts.require('MoneyToCurve');

const supplies = {
    sEUR: new BN('1000000000000000000000000'),
    EURS: new BN('10000')
};

const deposits = {
    sEUR: new BN('100000000000000000000'), 
    EURS: new BN('20000')
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
        await sEUR.transfer(user1, new BN('1000000000000000000000'), { from: owner });
        await EURS.transfer(user1, new BN('1000000000'), { from: owner });

        await sEUR.transfer(user2, new BN('1000000000000000000000'), { from: owner });
        await EURS.transfer(user2, new BN('1000000000'), { from: owner });
    });

    describe('Deposit your money into Curve.Fi', () => {
        it('Deposit', async() => {
            await sEUR.approve(moneyToCurve.address, deposits.sEUR, {from:user1});
            await EURS.approve(moneyToCurve.address, deposits.EURS, {from:user1});

            let sEURBefore = await sEUR.balanceOf(user1);
            let EURSBefore = await EURS.balanceOf(user1);

            await moneyToCurve.multiStepDeposit(
                [deposits.sEUR, deposits.EURS, deposits.tusd, deposits.usdt], {from:user1});

                
            let sEURAfter = await sEUR.balanceOf(user1);
            let EURSAfter = await EURS.balanceOf(user1);

            expect(sEURBefore.sub(sEURAfter).toString(), "Not deposited sEUR").to.equal(deposits.sEUR.toString());
            expect(EURSBefore.sub(EURSAfter).toString(), "Not depositde EURS").to.equal(deposits.EURS.toString());
        });

        it('Funds are wrapped with Y-tokens', async() => {
            expect((await sEUR.balanceOf(ysEUR.address)).toString(), "sEUR not wrapped").to.equal(deposits.sEUR.toString());
            expect((await EURS.balanceOf(yEURS.address)).toString(), "EURS not wrapped").to.equal(deposits.EURS.toString());
        });

        it('Y-tokens are deposited to Curve.Fi Swap', async() => {
            expect((await ysEUR.balanceOf(curveSwap.address)).toString(), "YsEUR not deposited").to.equal(deposits.sEUR.toString());
            expect((await yEURS.balanceOf(curveSwap.address)).toString(), "YEURS not deposited").to.equal(deposits.EURS.toString());
        });

        it('Curve.Fi LP-tokens are staked in Gauge', async() => {
            let lptokens = deposits.sEUR.add(deposits.EURS.mul(new BN('1000000000000'))).add(deposits.tusd.mul(new BN('1000000000000'))).add(deposits.usdt);
            expect((await moneyToCurve.curveLPTokenStaked()).toString(), "Stake is absent").to.equal(lptokens.toString());
            expect((await curveGauge.balanceOf(moneyToCurve.address)).toString(), "Stake is absent in Gauge").to.equal(lptokens.toString());
        });

        it('CRV tokens are minted and transfered to the user', async() => {
            expect((await crvToken.balanceOf(user1)).toNumber(), "No CRV tokens").to.be.gt(0);
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

            expect(sEURAfter.sub(sEURBefore).toString(), "Not withdrawn sEUR").to.equal(deposits.sEUR.toString());
            expect(EURSAfter.sub(EURSBefore).toString(), "Not withdrawn EURS").to.equal(deposits.EURS.toString());

        });
    });
});
