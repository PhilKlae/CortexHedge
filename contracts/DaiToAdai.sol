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


// This is the main building block for smart contracts.
contract DaiToAdai {
    //LendingPoolAddressesProvider public addressProvider;

    // Lendingpool adress provider kovan 0x88757f2f99175387ab4c6a4b3067c77a695b0349
    //get lending pool adress

    //  ADAI public s; // kovan 0x3ae4c2a436f1e5f995310179be2e838ab5cfa4c3        

    address constant public DAI_Adress = 0x6B175474E89094C44Da98b954EedeAC495271d0F; //mainnet
    address constant public aDAI_Address = 0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d; //mainnet
  
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
                address(0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5)
            ); // Kovan address, for other addresses: https://docs.aave.com/developers/getting-started/deployed-contracts
       
        
        console.log("Got adress");
        
        ILendingPool lendingPool = ILendingPool(provider.getLendingPool());

        console.log("created lending pool");
        return address(lendingPool);
    }

    function deposit(
        address pool,
        address token, 
        uint256 amount
    ) public {        
        ILendingPool(pool).deposit(token, amount, msg.sender, 0);
    }

    function withdraw(
        address pool,
        address token,        
        uint256 amount
    ) public {
        ILendingPool(pool).withdraw(token,amount,msg.sender);
    }

    function addAllowance(
        address pool,         
        uint256 amount
    ) public {        
        IERC20(DAI_Adress).approve(pool, amount );
    }

    function GetPrincipalAmount ()        
    external view returns(uint256)
    {        
        return IAToken(aDAI_Address).scaledBalanceOf(msg.sender);
    }
    
}
