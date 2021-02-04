pragma solidity ^0.5.12;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

import "./curve_integration/curvefi/ICurveFi_DepositY.sol";
import "./curve_integration/curvefi/ICurveFi_Gauge.sol";
import "./curve_integration/curvefi/ICurveFi_Minter.sol";
import "./curve_integration/curvefi/ICurveFi_SwapY.sol";
import "./curve_integration/curvefi/IYERC20.sol";


