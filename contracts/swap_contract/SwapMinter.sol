/* toDO
+ create new role which sets token address and gets burned
*/

// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "./PriceConsumerV3DAIEUR.sol";
import "hardhat/console.sol";
import "../Aavestuff/AaveImplementation.sol";

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

abstract contract SwapMinter is PriceConsumerV3DAIEUR, Ownable, AaveImplementation {
    using SafeMath for uint256;
    using Math for uint256;

    // USDFLOAT and USDFLOAT are both ERC20 tokens
    ERC20PresetMinterPauser public EURFIX;
    ERC20PresetMinterPauser public USDFLOAT;

    //DaiToken Dai;

    // exchange rate informations
    uint256 public exchange_rate_start;

    // balance of the pool
    uint256 public total_pool_prinicipal;
    uint256 public total_pool_balance;
    
      address eursAddress;
    address seurAddress;
    address MoneyToCurveAddress;

    // savings period
    enum InvestmentPhase
    {
        PreSavings,
        Savings,
        Redeeming
    }
    InvestmentPhase public current_phase;

    // toDO:
    // save ERC20, chainlink oracle decimals as uint to use in calculations
    event Shares_Minted(
        address _sender,
        uint256 Dai_amount,
        uint256 exchange_rate
    );

  
    ERC20 public Dai;


    modifier isSavingsPhase () {
        require(current_phase == InvestmentPhase.Savings, "No savings phase currently");
        _;
    }

    function start_saving() public onlyOwner {
        // allow minting of tokens
        current_phase = InvestmentPhase.Savings;

        // initialize exchange rate
        exchange_rate_start = uint256(getEUROPrice());

        // inititiate pool balances
        uint current_balance = Dai.balanceOf(address(this));
        //console.log("Current contract balance is:", current_balance);
        require(current_balance>0, "Pool Balance must be larger than 0");

        // balance must be larger than 0 to start the savings process 
        total_pool_prinicipal = current_balance;
        total_pool_balance = current_balance;


    }

    function invest(uint256 Dai_amount) public isSavingsPhase() {
        bool success = Dai.transferFrom(msg.sender, address(this), Dai_amount);
        require(success, "buy failed");

        //invest 50% into aave
        contractDepositDai(Dai_amount.div(2));


        //get the fake coins first, from uniswap

        //approve so the Curve integration can spend the tokens
        ERC20(seurAddress).approve(MoneyToCurveAddress,Dai_amount.div(2).div(2));
        ERC20(eursAddress).approve(MoneyToCurveAddress,Dai_amount.div(2).div(2));

        uint[2] memory curveInvestment;//Maybe bug? what does memory do
        
        //invest 50% into curve
        curveInvestment[0] = Dai_amount.div(2).div(2); //half eurs
        curveInvestment[1] = Dai_amount.div(2).div(2); //half seur
        
        IMoneyToCurve(MoneyToCurveAddress).multiStepDeposit(curveInvestment);
        

        _mint_tokens(Dai_amount);
        emit Shares_Minted(msg.sender, Dai_amount, uint256(getEUROPrice()));
    }

    function _mint_tokens(uint256 Dai_amount) internal {
        // scale amount by interest earned today

        uint Dai_principal_amount = Dai_amount.mul(total_pool_prinicipal).div(
            total_pool_balance
        );
        // requirements: getter function for interest earned. this might be complicated if a
        // complex investment strategy is in place
        _mint_euro_stable(Dai_principal_amount.div(2));
        _mint_euro_unstable(Dai_principal_amount.div(2));

        total_pool_prinicipal = total_pool_prinicipal.add(Dai_principal_amount);
    }

    // mint derivative tokens
    function _mint_euro_stable(uint256 Dai_amount) internal {
        // uint256 EURFIX_amount = _Dai_to_EURFIX(Dai_amount);
        EURFIX.mint(msg.sender, Dai_amount);
    }

    function _Dai_to_EURFIX(uint256 _amount) internal view returns (uint256) {
        return _amount.mul(10**8).div(exchange_rate_start);
    }

    function _mint_euro_unstable(uint256 Dai_amount) internal {
        // conversion is one to one!
        USDFLOAT.mint(msg.sender, Dai_amount);
    }

    
}

interface IMoneyToCurve {
    
    function multiStepDeposit(uint256[2] memory _amounts) external;
    function multiStepWithdraw(uint256[2] memory _amounts) external; 
    function getEuroValue() external view returns (uint256);
 //   function withdraw(address asset, uint256 amount, address to) external;

}
