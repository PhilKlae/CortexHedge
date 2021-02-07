// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract EUROdebt is ERC20PresetMinterPauser {
    constructor(address minter_address)
        public
        ERC20PresetMinterPauser("EUROd", "EUROdebt")
    {
        _setupRole(MINTER_ROLE, minter_address);
    }
}
