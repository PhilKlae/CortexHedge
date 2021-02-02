const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

// this work is based on https://medium.com/better-programming/how-to-integrate-the-curve-fi-protocol-into-your-defi-protocol-e1d4c43f716d
// code is rewritten to accompany  

describe("Swap Curve integration tests", function () {
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
    /*
    const ERC20 = artifacts.require('Stub_ERC20');
    const YERC20 = artifacts.require('Stub_YERC20');

    const curveDeposit = artifacts.require('Stub_CurveFi_DepositY');
    const curveSwap = artifacts.require('Stub_CurveFi_SwapY');
    const curveLPToken = artifacts.require('Stub_CurveFi_LPTokenY');
    const CurveCRVMinter = artifacts.require('Stub_CurveFi_Minter');
    const curveGauge = artifacts.require('Stub_CurveFi_Gauge');

    const moneyToCurve = artifacts.require('moneyToCurve');
    */


    const supplies = {
        sEUR: new BN('1000000000000000000000000'),
        EURS: new BN('10000')
    };

    const deposits = {
        sEUR: new BN('100000000000000000000'), 
        EURS: new BN('20000')
    }

    const transfers = {
        sEUR: new BN('1000000000000000000000'), 
        EURS: new BN('10')
    }

    beforeEach('Set up accounts', async () => {
        // get addresses to interact
        [owner,  defiowner, user1, user2, ...addrs] = await ethers.getSigners();
  
    });

    beforeEach(async() => {
        // Prepare stablecoins stubs
        const tmpsEUR = await ethers.getContractFactory('Stub_ERC20');
        sEUR = await upgrades.deployProxy(tmpsEUR, ['sEUR', 'sEUR', 18, supplies.sEUR.toString()], { initializer: 'initialize(string,string,uint8,uint256)'}, {from:owner});
        await sEUR.deployed();
        const tmpEURS = await ethers.getContractFactory('Stub_ERC20');
        EURS = await upgrades.deployProxy(tmpEURS, ['EURS', 'EURS', 2, supplies.EURS.toString()], { initializer: 'initialize(string,string,uint8,uint256)'}, {from:owner});
        await EURS.deployed();
        
        //Prepare Y-token wrappers
        const tmpysEUR = await ethers.getContractFactory('Stub_YERC20');
        ysEUR = await upgrades.deployProxy(tmpysEUR, [sEUR.address, 'ysEUR', 18],{ initializer: 'initialize(address, string, uint8)' }, {from:owner});
        await ysEUR.deployed();
        const tmpyEURS = await ethers.getContractFactory('Stub_YERC20');
        yEURS = await upgrades.deployProxy(tmpyEURS, [EURS.address, 'yEURS', 2], { initializer: 'initialize(address, string, uint8)' }, {from:owner});
        await yEURS.deployed();
        
        //Prepare stubs of Curve.Fi
        const tmpcurveLPToken = await ethers.getContractFactory('Stub_CurveFi_LPTokenY');
        curveLPToken = await upgrades.deployProxy(tmpcurveLPToken, { initializer: 'initialize()' },{from:owner});
        await curveLPToken.deployed();
        
        const tmpcurveSwap = await ethers.getContractFactory('Stub_CurveFi_SwapY');
        curveSwap = await upgrades.deployProxy(tmpcurveSwap, 
            [
            [ysEUR.address, yEURS.address],
            [sEUR.address, EURS.address],
            curveLPToken.address, 10
            ]
            ,{initializer: 'initialize(address[2], address[2], address, uint256)'}
            ,{from:owner});
        await curveLPToken.connect(owner).addMinter(curveSwap.address);

        const tmpcurveDeposit = await ethers.getContractFactory('Stub_CurveFi_DepositY');
        curveDeposit = await upgrades.deployProxy(tmpcurveDeposit, 
            [
            [ysEUR.address, yEURS.address],
            [sEUR.address, EURS.address],
            curveSwap.address, curveLPToken.address
            ]
            ,{initializer: 'initialize(address[2], address[2], address, address)'}
            ,{from:owner});
        await curveLPToken.connect(owner).addMinter(curveDeposit.address);

    
        const tmpcrvToken = await ethers.getContractFactory('Stub_ERC20');
        crvToken = await upgrades.deployProxy(tmpcrvToken, ['CRV', 'CRV', 18, 0], { initializer: 'initialize(string,string,uint8,uint256)'}, {from:owner});
        await crvToken.deployed();
        
        const tmpcurveMinter = await ethers.getContractFactory('Stub_CurveFi_Minter');
        curveMinter = await upgrades.deployProxy(tmpcurveMinter,[crvToken.address], { initializer: 'initialize(address)'}, {from:owner});
        await crvToken.deployed();
        await crvToken.connect(owner).addMinter(curveMinter.address);
        
        const tmpcurveGauge = await ethers.getContractFactory('Stub_CurveFi_Gauge');
        curveGauge = await upgrades.deployProxy(tmpcurveGauge,[curveLPToken.address, curveMinter.address],{ initializer: 'initialize(address, address)'}, {from:owner});
        await crvToken.deployed();
        await crvToken.connect(owner).addMinter(curveGauge.address);   

        
        //Main contract
        
        const tmpmoneyToCurve = await ethers.getContractFactory('MoneyToCurve');
        moneyToCurve = await upgrades.deployProxy(tmpmoneyToCurve,{ initializer: 'initialize()'}, {from:defiowner});
        await moneyToCurve.connect(owner).setup(curveDeposit.address, curveGauge.address, curveMinter.address); // use owner instead of defiowner here!
        
        //Preliminary balances
        
        await sEUR.connect(owner).transfer(user1.address, transfers.sEUR.toString());
        await EURS.connect(owner).transfer(user1.address, transfers.EURS.toString());
        
        await sEUR.connect(owner).transfer(user2.address, transfers.sEUR.toString());
        await EURS.connect(owner).transfer(user2.address, transfers.EURS.toString());
    });

    describe('Deposit your money into Curve.Fi', () => {
        it('Deposit', async() => {
            await sEUR.connect(user1).approve(moneyToCurve.address, deposits.sEUR.toString());
            await EURS.connect(user1).approve(moneyToCurve.address, deposits.EURS.toString());

            let sEURBefore = await sEUR.balanceOf(user1.address);
            let EURSBefore = await EURS.balanceOf(user1.address);
            console.log("before transaction")
            await moneyToCurve.connect(user1).multiStepDeposit(
                [deposits.sEUR.toString(), deposits.EURS.toString()]);
            console.log("after transaction")
                
            let sEURAfter = await sEUR.balanceOf(user1.address);
            let EURSAfter = await EURS.balanceOf(user1.address);

            expect(sEURBefore.sub(sEURAfter).toString(), "Not deposited sEUR").to.equal(deposits.sEUR.toString());
            expect(EURSBefore.sub(EURSAfter).toString(), "Not depositde EURS").to.equal(deposits.EURS.toString());
        });

        it('Funds are wrapped with Y-tokens', async() => {
            expect((await sEUR.balanceOf(ysEUR.address)).toString(), "sEUR not wrapped").to.equal(deposits.sEUR.toString());
            expect((await EURS.balanceOf(yEURS.address)).toString(), "EURS not wrapped").to.equal(deposits.EURS.toString());
        });

        it('Y-tokens are deposited to Curve.Fi Swap', async() => {
            expect((await ysEUR.balanceOf(curveSwap.address)).toString(), "ysEUR not deposited").to.equal(deposits.sEUR.toString());
            expect((await yEURS.balanceOf(curveSwap.address)).toString(), "yEURS not deposited").to.equal(deposits.EURS.toString());
        });

        it('Curve.Fi LP-tokens are staked in Gauge', async() => {
            let lptokens = deposits.sEUR.add(deposits.EURS.mul(new BN('1000000000000')));
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
