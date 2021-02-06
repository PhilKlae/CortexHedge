// SPDX-License-Identifier: MIT
// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
//import IERC20.sol;

pragma solidity ^0.6.12;


import "hardhat/console.sol";

//import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";

import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";

import "@aave/protocol-v2/contracts/interfaces/IAToken.sol";



// adai address: 0xdCf0aF9e59C002FA3AA091a46196b37530FD48a8


contract AaveExample {
    IERC20 public dai = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    IERC20 public adai = IERC20(0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d);
    ILendingPool public aaveLendingPool = ILendingPool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);


    constructor() public {
        dai.approve(address(aaveLendingPool), type(uint256).max);
        adai.approve(address(aaveLendingPool), type(uint256).max);
    }

    function contractDepositDai(uint256 _amountInDai) external {       
        dai.transferFrom(msg.sender, address(this), _amountInDai);
        aaveLendingPool.deposit(address(dai), _amountInDai, address(this), 0);
    }

    function userWithdrawDai(uint256 _amountInDai) external {
        aaveLendingPool.withdraw(address(dai), _amountInDai, address(this));//use adai as asset address?
          dai.transferFrom(address(this), msg.sender , _amountInDai);
    }
}



