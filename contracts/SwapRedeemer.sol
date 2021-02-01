/* toDO
+ create new role which sets token address and gets burned
*/

// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "./SwapMinter.sol";
import "hardhat/console.sol";

abstract contract SwapRedeemer is SwapMinter {
    using SafeMath for uint256;
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
        // allow minting of tokens
        current_phase = InvestmentPhase.Redeeming;

        exchange_rate_end = uint256(getEUROPrice());

        // calculate global numbers once to save gas
        final_total_pool_balance = Dai.balanceOf(address(this));
        console.log("Final pool balance is: ", final_total_pool_balance);
        console.log("Final pool principal is: ", total_pool_prinicipal);
        
        // check how much return was generate on assets
        final_interest_earned = final_total_pool_balance.sub(
            total_pool_prinicipal
        );
        console.log("Interest earned is: ", final_interest_earned);
        // check what the final payout of the derivative is
        final_EURFIX_payout_rate = calculate_EURFIX_payout(exchange_rate_end);
        console.log("EURFIX payout rate is: ", final_EURFIX_payout_rate);
        final_USDFLOAT_payout = calculate_USDFLOAT_payout(exchange_rate_end);
    }

    modifier isRedeemingsPhase() {
        require(current_phase == InvestmentPhase.Redeeming, "No savings phase currently");
        _;
    }

    function redeem(uint256 EURFIX_amount, uint256 USDFLOAT_amount) public {
        require(
            EURFIX_amount == USDFLOAT_amount,
            "Only equal split allowed"
        );

        // burn ingoing tokens
        EURFIX.burn(EURFIX_amount);
        USDFLOAT.burn(USDFLOAT_amount);

        // estimate return on capital and return share earned (use that USD amount is indep. of exchange rate here)
        uint256 Dai_returned =
            USDFLOAT_amount.mul(2).mul(total_pool_balance).div(
                total_pool_prinicipal
            );
        emit Shares_Redeemed(msg.sender, Dai_returned, uint256(getEUROPrice()));
    }

    // redeem derivative tokens
    function redeem_EURFIX(uint256 EURFIX_amount) external  isRedeemingsPhase() {
        // require(saving_is_over, "Saving period has not stopped yet");
        uint256 usd_amount_retail = EURFIX_to_Dai(EURFIX_amount);
        EURFIX.burnFrom(msg.sender, EURFIX_amount);
        Dai.transfer(msg.sender, usd_amount_retail);
        emit Redeemed_EURFIX(msg.sender, EURFIX_amount, exchange_rate_end);
        final_total_pool_balance = final_total_pool_balance.sub(
            usd_amount_retail
        );
    }

    function redeem_USDFLOAT(uint256 USDFLOAT_amount) external  isRedeemingsPhase() {
        // require(saving_is_over, "Saving period has not stopped yet");
        uint256 usd_amount_hedger = USDFLOAT_to_Dai(USDFLOAT_amount);
        USDFLOAT.burnFrom(msg.sender, USDFLOAT_amount);
        Dai.transfer(msg.sender, usd_amount_hedger);
        emit Redeemed_EURFIX(msg.sender, USDFLOAT_amount, exchange_rate_end);
        final_total_pool_balance = final_total_pool_balance.sub(
            usd_amount_hedger
        );
    }

    // redeem EURFIX tokens
    function EURFIX_to_Dai(uint256 _amount) public view returns (uint256) {
        uint256 interest_part = EURFIX_interest(_amount, exchange_rate_start);
        uint256 principal_part =
            EURFIX_to_dollar(_amount, final_EURFIX_payout_rate);
        return principal_part.add(interest_part);
    }

    // convert back to initial exchange rate to calculate share of earned interest
    function EURFIX_interest(uint256 _amount, uint256 _exchange_rate)
        internal
        view
        returns (uint256)
    {
        return
            _amount
                .mul(_exchange_rate)
                .mul(final_interest_earned)
                .div(total_pool_prinicipal)
                .div(chainlink_decimals); //
    }

    function EURFIX_to_dollar(uint256 _amount, uint256 _exchange_rate)
        internal
        view
        returns (uint256)
    {
        return _amount.mul(_exchange_rate).div(chainlink_decimals);
    }

    // redeem USDFLOAT tokens
    function USDFLOAT_to_Dai(uint256 _amount) public view returns (uint256) {
        uint256 interest_part = USDFLOAT_interest(_amount);
        uint256 principal_part = USDFLOAT_to_dollar(_amount);
        return principal_part.add(interest_part);
    }

    function USDFLOAT_interest(uint256 _amount)
        internal
        view
        returns (uint256)
    {
        return _amount.mul(final_interest_earned).div(total_pool_prinicipal);
    }

    function USDFLOAT_to_dollar(uint256 _amount)
        internal
        view
        returns (uint256)
    {
        return _amount.mul(final_USDFLOAT_payout).div(chainlink_decimals);
    }

    // limit exchange rate movements hedged by the contract to 50% up/down
    // max(min(e_T/e_0, 1 + 1 /leverage), 1/leverage)
    // e.g. for leverage = 2: ouput is bounded by 50%.
    // see: valuation exercise.txt
    // payout is always [0,2]
    // in theory: limit payout << payout factor since value increase allows higher payout
    function calculate_EURFIX_payout(uint256 _exchange_rt)
        public
        view
        returns (uint256)
    {
        uint256 min_payout_factor =
            (chainlink_decimals.add(leverage_inverse)).mul(exchange_rate_start); // (1 + 1/leverage) * e_0
        console.log("Min payout factor is:", min_payout_factor);
        console.log("Leverage inverse is: ", leverage_inverse);
        
        uint256 max_payout_factor =
            (chainlink_decimals.sub(leverage_inverse)).mul(exchange_rate_start); // (1 - 1/leverage) * e_0
        return
            _exchange_rt.max(min_payout_factor).min(max_payout_factor).mul(
                leverage
            ); // min(max(e, min_value), max_value)*leverage
    }

    // payout is always [0,2]
    function calculate_USDFLOAT_payout(uint256 _exchange_rt)
        public
        view
        returns (uint256)
    {
        uint256 ratio =
            _exchange_rt.mul(chainlink_decimals).div(exchange_rate_start); // e_T/e_0
        uint256 min_payout_factor = chainlink_decimals.add(leverage_inverse); // (1 + 1/leverage)
        uint256 max_payout_factor = chainlink_decimals.sub(leverage_inverse); // (1 - 1/leverage)

        ratio = ratio.max(min_payout_factor).min(max_payout_factor).mul(
            leverage
        ); // max(min(e_T/e_1, 1 + 1/leverage), 1 - 1/leverage) * leverage
        uint256 normalizer = 2 * chainlink_decimals;
        return normalizer.sub(ratio).div(10); // 2 - max(min(e_T/e_1, 1 + 1/leverage), 1 - 1/leverage) * leverage
    }
}
2