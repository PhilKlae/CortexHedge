/* toDO
+ create new role which sets token address and gets burned
*/

// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "./SwapMinter.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/math/SignedSafeMath.sol";

abstract contract SwapRedeemer is SwapMinter {
    using SafeMath for uint256;
    using SafeMath for int256;
    using Math for uint256;

    // exchange rate informations
    uint256 public exchange_rate_end;

    // parameterization
    uint256 public leverage = 10;
    uint256 public chainlink_decimals = 10**8;
    uint256 public leverage_inverse = chainlink_decimals.div(leverage); // 1/leverage


    // pool estimates
    uint256 public final_interest_earned;
    uint256 public final_total_pool_balance;

    // growth estimates
    uint256 public final_EURFIX_payout_rate;
    uint256 public final_USDFLOAT_payout;


    // toDO:
    // save ERC20, chainlink oracle decimals as uint to use in calculations
    event Shares_Redeemed(
        address _sender,
        uint256 Dai_amount,
        uint256 exchange_rate
    );

    event Redeemed_EURFIX(
        address _sender,
        uint256 EURFIX_amount,
        uint256 exchange_rate
    );
    event Redeemed_USDFLOAT(
        address _sender,
        uint256 USDFLOAT_amount,
        uint256 exchange_rate
    );

    function start_redeeming() public onlyOwner {
        
        //get 100% of DAI back from aave, including principal
        userWithdrawDai(uint(-1));//TODO more precise number? maybe balanceof adai?
        
        IMoneyToCurve moneyToCurve = IMoneyToCurve(MoneyToCurveAddress);

        uint[2] memory curveInvestment;//Maybe bug? what does memory do        
        //invest 50% into curve
        curveInvestment[0] = moneyToCurve.getEuroValue().div(2); //half eurs TODO decimals?
        curveInvestment[1] = moneyToCurve.getEuroValue().div(2); //half seur TODO decimals?

        moneyToCurve.multiStepWithdraw(curveInvestment); //TODO decimals?

        //transfer back to DAI using uniswap TODO here


        // allow minting of tokens
        current_phase = InvestmentPhase.Redeeming;

        exchange_rate_end = uint256(getEUROPrice());

        // calculate global numbers once to save gas
        final_total_pool_balance = Dai.balanceOf(address(this));
        //console.log("Final pool balance is: ", final_total_pool_balance);
        //console.log("Final pool principal is: ", total_pool_prinicipal);
        
        // check how much return was generate on assets
        final_interest_earned = final_total_pool_balance.sub(
            total_pool_prinicipal
        );
        //console.log("Interest earned is: ", final_interest_earned);
        // check what the final payout of the derivative is
        final_EURFIX_payout_rate = calculate_EURFIX_payout(exchange_rate_end);
        //console.log("EURFIX payout rate is: ", final_EURFIX_payout_rate);
        final_USDFLOAT_payout = calculate_USDFLOAT_payout(exchange_rate_end);
        //console.log("USDFLOAT payout rate is: ", final_EURFIX_payout_rate);
    }
    modifier isRedeemingsPhase() {
        require(current_phase == InvestmentPhase.Redeeming, "No savings phase currently");
        _;
    }

  

    function redeem(uint256 EURFIX_amount, uint256 USDFLOAT_amount) public {
        require(
            EURFIX_amount == USDFLOAT_amount,
            "Must exchange same amount of EURFIX and USDFLOAT"
        );
        // burn ingoing tokens
        EURFIX.burnFrom(msg.sender, EURFIX_amount);
        USDFLOAT.burnFrom(msg.sender, USDFLOAT_amount);

        // estimate return on capital and return share earned (use that USD amount is indep. of exchange rate here)
        /* Dai_returned = USDFLOAT_amount * balance/principal * 2 
        using: USDLOAT + EURFIX = 2 * USDFLOAT
        */
        uint256 Dai_returned =
            USDFLOAT_amount
            .mul(currentPoolBalance())
            .div(total_pool_prinicipal)
            .mul(2);     

        /*console.log(
            "amount invested:",
            EURFIX_amount.add(USDFLOAT_amount),
            "amount returned:",
            Dai_returned
        );*/
        emit Shares_Redeemed(msg.sender, Dai_returned, uint256(getEUROPrice()));
        
        userWithdrawDai(Dai_returned);//TODO Check if this is correct number, Replace with a function that also withdraws from curve
        
        total_pool_prinicipal -= (EURFIX_amount.add(USDFLOAT_amount));
        
        Dai.transfer(msg.sender, Dai_returned);
    }

    function currentPoolBalance() internal returns(uint256){
        /* change this temporally to returning total_pool_prinicipal.
        currenty, fork does returns adai balance as 0 */
        return total_pool_prinicipal;
        //return GetAdaiAmount(); //total_pool_balance is 100% aave atm
    }

    // redeem derivative tokens
    function redeem_EURFIX(uint256 EURFIX_amount) external  isRedeemingsPhase() {
        uint256 usd_amount_retail = EURFIX_to_Dai(EURFIX_amount, final_EURFIX_payout_rate);
        EURFIX.burnFrom(msg.sender, EURFIX_amount);
        Dai.transfer(msg.sender, usd_amount_retail);
        emit Redeemed_EURFIX(msg.sender, EURFIX_amount, exchange_rate_end);
        final_total_pool_balance = final_total_pool_balance.sub(
            usd_amount_retail
        );
    }

    function redeem_USDFLOAT(uint256 USDFLOAT_amount) external  isRedeemingsPhase() {
        uint256 usd_amount_hedger = USDFLOAT_to_Dai(USDFLOAT_amount, final_USDFLOAT_payout);
        USDFLOAT.burnFrom(msg.sender, USDFLOAT_amount);
        Dai.transfer(msg.sender, usd_amount_hedger);
        emit Redeemed_EURFIX(msg.sender, USDFLOAT_amount, exchange_rate_end);
        final_total_pool_balance = final_total_pool_balance.sub(
            usd_amount_hedger
        );
    }

    // redeem EURFIX tokens
    function EURFIX_to_Dai(uint256 _amount, uint _EUFIXpayoutRate) public view returns (uint256) {
        uint256 interest_part = _EURFIX_interest(_amount);
        uint256 principal_part =
            _EURFIX_to_dollar(_amount, _EUFIXpayoutRate);
        return principal_part.add(interest_part);
    }

    // convert back to initial exchange rate to calculate share of earned interest
    function _EURFIX_interest(uint256 _amount)
        internal
        view
        returns (uint256)
    {
        return
            _amount
                .mul(final_interest_earned)
                .div(total_pool_prinicipal)
                .div(chainlink_decimals); //
    }

    function _EURFIX_to_dollar(uint256 _amount, uint256 _EUFIXpayoutRate)
        internal
        view
        returns (uint256)
    {
        return _amount.mul(_EUFIXpayoutRate).div(chainlink_decimals);
    }

    // redeem USDFLOAT tokens
    function USDFLOAT_to_Dai(uint256 _amount, uint256 _USDFLOATpayoutRate) public view returns (uint256) {
        uint256 interest_part = _USDFLOAT_interest(_amount);
        uint256 principal_part = _USDFLOAT_to_dollar(_amount, _USDFLOATpayoutRate);
        return principal_part.add(interest_part);
    }

    function _USDFLOAT_interest(uint256 _amount)
        internal
        view
        returns (uint256)
    {
        return _amount.mul(final_interest_earned).div(total_pool_prinicipal);
    }

    function _USDFLOAT_to_dollar(uint256 _amount, uint256 _USDFLOATpayoutRate)
        internal
        view
        returns (uint256)
    {
        return _amount.mul(_USDFLOATpayoutRate).div(chainlink_decimals);
    }

    // payout is always between [0,2]
    function calculate_EURFIX_payout(uint256 _exchange_rt)
        public
        view
        returns (uint256)
    {       
        //console.log("calculate_USDFLOAT_payout()");
        uint256 payout_fac_constrained;
        uint256 max_payout_factor = 2 * chainlink_decimals; // 2  
        if (_exchange_rt > exchange_rate_start) {
            /* payout for 1: 
                            min(1 +  (e1 - e0)/e0 * leverage, 2) 
            */
            //console.log("euro lost value");
            uint exchange_rate_delta = _exchange_rt.sub(exchange_rate_start).mul(chainlink_decimals).div(exchange_rate_start); // (e1 - e0)/e0 
            uint exchange_rate_delta_leverage = exchange_rate_delta.mul(leverage); // (e1 - e0)/e0 * leverage
            uint payout_fac = chainlink_decimals.add(exchange_rate_delta_leverage); // 1 + (e1 - e0)/e0 * leverage 
            payout_fac_constrained = payout_fac.min(max_payout_factor); // fac = min(1+ (e1 - e0)/e0 * leverage , 2)

        }   
        else if (_exchange_rt < exchange_rate_start) {
            /* payout for 1: 
                            max(1 +  (e1 - e0)/e0 * leverage, 0)
                    <=>     max(1 -  (e0 - e1)/e0 * leverage, 0)
                    <=> 1 - min(     (e0 - e1)/e0 * leverage, 1)
            */
            //console.log("euro gained value");
            uint exchange_rate_delta_inv = exchange_rate_start.sub(_exchange_rt).mul(chainlink_decimals).div(exchange_rate_start);  // (e0 - e1)/e0
            uint exchange_rate_delta_inv_leverage = exchange_rate_delta_inv.mul(leverage); // (e0 - e1)/e0 * leverage
            uint exchange_rate_delta_inv_leverage_constrained = exchange_rate_delta_inv_leverage.min(chainlink_decimals); // min((e0 - e1)/e0 * leverage,1)
            payout_fac_constrained = chainlink_decimals.sub(exchange_rate_delta_inv_leverage_constrained);
        }
        else {
            //console.log("exchange rate constant");
            payout_fac_constrained = chainlink_decimals; // fac = 1
        }
  
        return payout_fac_constrained; // min(max(e, min_value), max_value)*leverage
    }

    // payout is always between [0,2]
    function calculate_USDFLOAT_payout(uint256 _exchange_rt)
        public
        view
        returns (uint256)
    {
        uint256 normalizer = 2 * chainlink_decimals;
        //console.log("Normalizer is: ", normalizer);
        uint payour_rt_constrained = normalizer.sub(calculate_EURFIX_payout(_exchange_rt));
        return 
            payour_rt_constrained;
    }
}
