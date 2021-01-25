// SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;

import '@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol';

contract EURFIX is ERC20PresetMinterPauser {
    constructor(address minter_address) public ERC20PresetMinterPauser("EURFIX", "EURFIX") {
        _setupRole(MINTER_ROLE, minter_address);
    }
}
