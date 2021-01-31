/* toDO
+ create new role which sets token address and gets burned
*/

// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "./PriceConsumerV3DAIEUR.sol";

/* Use  mock Dai token for testing purposes
interface DaiToken {
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool success);

    function transfer(address dst, uint256 wad) external returns (bool);

    function balanceOf(address guy) external view returns (uint256);
}
*/

contract SwapMinter is PriceConsumerV3DAIEUR, Ownable {
    using SafeMath for uint256;
    using Math for uint256;

    // USDFLOAT and USDFLOAT are both ERC20 tokens
    ERC20PresetMinterPauser public EURFIX;
    ERC20PresetMinterPauser public USDFLOAT;

    //DaiToken Dai; mdr

    // exchange rate informations
    uint256 public exchange_rate_start;

    uint256 public total_pool_prinicipal;
    uint256 public total_pool_balance;

    // toDO:
    // save ERC20, chainlink oracle decimals as uint to use in calculations
    event Shares_Minted(
        address _sender,
        uint256 Dai_amount,
        uint256 exchange_rate
    );

    constructor() public PriceConsumerV3DAIEUR() {}

    ERC20 public Dai;

    function start_saving() public onlyOwner {
        //round_is_over = true;
        exchange_rate_start = uint256(getEUROPrice());
    }

    function invest(uint256 Dai_amount) public {
        bool success = Dai.transferFrom(msg.sender, address(this), Dai_amount);
        require(success, "buy failed");
        _mint_tokens(Dai_amount);
        emit Shares_Minted(msg.sender, Dai_amount, uint256(getEUROPrice()));
    }

    function _mint_tokens(uint256 Dai_amount) internal {
        // scale amount by interest earned today
        Dai_amount = Dai_amount.mul(total_pool_prinicipal).div(
            total_pool_balance
        );
        // requirements: getter function for interest earned. this might be complicated if a
        // complex investment strategy is in place
        _mint_euro_stable(Dai_amount.div(2));
        _mint_euro_unstable(Dai_amount.div(2));
    }

    // mint derivative tokens
    function _mint_euro_stable(uint256 Dai_amount) internal {
        uint256 EURFIX_amount = _Dai_to_EURFIX(Dai_amount);
        EURFIX.mint(msg.sender, EURFIX_amount);
    }

    function _Dai_to_EURFIX(uint256 _amount) internal view returns (uint256) {
        return _amount.mul(10**8).div(uint256(getEUROPrice()));
    }

    function _mint_euro_unstable(uint256 Dai_amount) internal {
        // conversion is one to one!
        USDFLOAT.mint(msg.sender, Dai_amount);
    }
}
