// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DAI is ERC20 {
    constructor(uint256 initialSupply) public ERC20("DAI", "DAI") {
        _mint(msg.sender, initialSupply);
    }
}