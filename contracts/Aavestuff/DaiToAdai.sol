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
    constructor() public {
        lendingPool = ILendingPool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);
        Dai = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
        aDAI = IERC20(0x363edC62b8236a0079c00320340485Ee0E7B17ae);
    }
    IERC20 public Dai;
    IERC20 public aDAI;
    ILendingPool public lendingPool;
    
    function getLending() external view returns(address) {
        return address(lendingPool);        
    }
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


    function deposit_new() public {
        uint256 amount = 1000;
        uint16 referralCode = 0;
        Dai.approve(address(lendingPool), amount);
        console.log("Pool owns total of", aDAI.balanceOf(address(this)), "aDai");
        console.log("User Balance", Dai.balanceOf(msg.sender));
        console.log("Amount is", amount);
        console.log("Pool has allowance of", Dai.allowance(msg.sender,address(lendingPool)), "to spend");
        lendingPool.deposit(address(Dai), amount, msg.sender, referralCode);
        console.log("Pool owns total of", aDAI.balanceOf(msg.sender), "aDai");
    }
    function withdraw_new() public {
        uint256 amount = uint(-1);
        lendingPool.withdraw(address(Dai), amount, address(this));
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
