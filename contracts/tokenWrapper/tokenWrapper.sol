// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";
import "hardhat/console.sol";

contract tokenWrapper is Ownable{
    using SafeMath for uint256;
    
    // ingoing tokens
    IERC20 public aDai;
    IERC20 public EURFIX;
    IERC20 public USDFLOAT;

    // outgoing tokens
    ERC20PresetMinterPauser public EUROsavings;
    ERC20PresetMinterPauser public EUROdebt;
    
    constructor(address _aDai_address, address _eurfix_address, address _usdfloat_address) {
        aDai = IERC20(_aDai_address);
        EURFIX = IERC20(_eurfix_address);
        USDFLOAT = IERC20(_usdfloat_address);
    }

    function setMinterTokens(address _savings_address, address _debt_address) public onlyOwner{
        EUROsavings = ERC20PresetMinterPauser(_savings_address);
        EUROdebt = ERC20PresetMinterPauser(_debt_address);
    }

    function wrapEUROsavings(uint256 _aDai_amount, uint256 _eurfix_amount) external returns(uint256) {
        require(
            _aDai_amount == _eurfix_amount.mul(10),
            "Must exchange tokens in ratio 1:10"
        );
        // send tokens
        bool successaDai = aDai.transferFrom(msg.sender, address(this), _aDai_amount);
        require(successaDai, "buy failed");
        bool successEURFIX = EURFIX.transferFrom(msg.sender, address(this), _eurfix_amount);
        require(successEURFIX, "buy failed");

        // mint EUROsavings
        uint mint_amount = _aDai_amount;
        EUROsavings.mint(msg.sender, mint_amount);
        return mint_amount;
    }

    function unwrapEUROsavings(uint256 _EUROsavings_amount) external returns(uint256) {
        // burn ingoing tokens
        EUROsavings.burnFrom(msg.sender, _EUROsavings_amount);
        console.log("can burn");
        // calculate number of tokens returned
        uint aDai_amount = _EUROsavings_amount.div(11); // 1/11
        uint eurfix_amount = _EUROsavings_amount.mul(10).div(11); // 10/11
        
        // approve addresses
        aDai.approve(msg.sender, aDai_amount);
        EURFIX.approve(msg.sender, eurfix_amount);
        console.log(aDai_amount);
        console.log(eurfix_amount);
        // send tokens
        console.log(aDai.allowance(address(this), msg.sender));
        console.log(EURFIX.allowance(address(this), msg.sender));
        console.log(aDai.allowance(msg.sender, address(this)));
        console.log(EURFIX.allowance(msg.sender, address(this)));
        console.log("Balances:");
        console.log(aDai.balanceOf(address(this)));
        console.log(EURFIX.balanceOf(address(this)));

        bool successaDai = aDai.transferFrom(address(this), msg.sender, aDai_amount);
        //bool successaDai = aDai.transfer(msg.sender, aDai_amount);
        require(successaDai, "buy failed");
        console.log("can trasfner adeai");
        bool successEURFIX = EURFIX.transferFrom(address(this), msg.sender, eurfix_amount);
        //bool successEURFIX = EURFIX.transfer(msg.sender, eurfix_amount);
        require(successEURFIX, "buy failed");
        console.log("can trasfner eurfix");
    }
}