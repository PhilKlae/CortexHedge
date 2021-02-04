// SPDX-License-Identifier: MIT

/* toDO
+ create new role which sets token address and gets burned
*/

pragma solidity 0.7.3;

import "./SwapRedeemer.sol";

contract SwapContract is SwapRedeemer {
    using SafeMath for uint256;
    using Math for uint256;

    constructor() public {}

    address public EURFIX_address;
    address public USDFLOAT_address;
    address public Dai_address;

    // set new address (used for testing)
    function set_EURFIX_address(address new_token_address) public onlyOwner {
        EURFIX_address = new_token_address;
        EURFIX = ERC20PresetMinterPauser(EURFIX_address);
    }
    function set_USDFLOAT_address(address new_token_address) public onlyOwner {
        USDFLOAT_address = new_token_address;
        USDFLOAT = ERC20PresetMinterPauser(new_token_address);
    }

    function set_Dai_address(address new_token_address) public onlyOwner {
        Dai_address = new_token_address;
        // Since we declare it in the construuctor, what is this for ?
        Dai = ERC20(new_token_address);
    }

    /* view your current balance */
    function get_EURFIX_to_Dai(address _address) public view returns (uint256) {
        uint256 _amount = EURFIX.balanceOf(_address);
        require(_amount > 0, "Balance is zero");
        return EURFIX_to_Dai(_amount);
    }

    function get_EURFIX_to_EUR(address _address) public view returns (uint256) {
        return _Dai_to_EUR(get_EURFIX_to_Dai(_address));
    }

    function get_USDFLOAT_to_Dai(address _address)
        public
        view
        returns (uint256)
    {
        uint256 _amount = USDFLOAT.balanceOf(_address);
        return USDFLOAT_to_Dai(_amount);
    }
 
    function get_USDFLOAT_to_EUR(address _address)
        public
        view
        returns (uint256)
    {
        return _Dai_to_EUR(get_USDFLOAT_to_Dai(_address));
    }

    function get_current_phase() public view returns (InvestmentPhase) {
        return current_phase;
    }

    // exchange rate conversion helper
    function _Dai_to_EUR(uint256 _amount) internal view returns (uint256) {
        return _amount.mul(uint256(getDAIPrice())).div(uint256(getDAIPrice()));
    }

    function _Dai_to_USD(uint256 _amount) internal view returns (uint256) {
        return _amount.mul(uint256(getDAIPrice())).div(10**8);
    }

}
