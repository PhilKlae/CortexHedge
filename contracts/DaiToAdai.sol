// SPDX-License-Identifier: MIT
// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
//import IERC20.sol;

pragma solidity ^0.6.12;

import "hardhat/console.sol";

import "@aave/protocol-v2/contracts/interfaces/ILendingPool.sol";

import "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";

// This is the main building block for smart contracts.
contract DaiToAdai {
    //LendingPoolAddressesProvider public addressProvider;

    // Lendingpool adress provider kovan 0x88757f2f99175387ab4c6a4b3067c77a695b0349
    //get lending pool adress

    //  ADAI public s; // kovan 0x3ae4c2a436f1e5f995310179be2e838ab5cfa4c3

    //approveDelegation()
    /**
     * Contract initialization.
     *
     * The `constructor` is executed only once when the contract is created.
     */
    constructor() public {}

    function GetLendingPoolAdress() external view returns (address) {
        /// Retrieve LendingPool address
        console.log("Getting lending pool address");
        ILendingPoolAddressesProvider provider =
            ILendingPoolAddressesProvider(
                address(0x88757f2f99175387ab4c6a4b3067c77a695b034900)
            ); // Kovan address, for other addresses: https://docs.aave.com/developers/getting-started/deployed-contracts
       
        
        console.log("Got adress");
        
        ILendingPool lendingPool = ILendingPool(provider.getLendingPool());

        console.log("created lending pool");
        return address(lendingPool);
    }

    function deposit(
        address pool,
        address token,
        address user,
        uint256 amount
    ) public {
        ILendingPool(pool).deposit(token, amount, user, 0);
    }
}
