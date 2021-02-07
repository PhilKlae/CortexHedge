pragma solidity ^0.6.6;

import "hardhat/console.sol";

import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapConnector {
    address public immutable factoryAddress;
    address public immutable routerAddress;
    IERC20 public DAI;
    IERC20 public EUR;

    constructor(address _factory, address _router, address _DAI, address _EUR) public {
        factoryAddress = _factory;
        routerAddress = _router;
        DAI = IERC20(_DAI);
        EUR = IERC20(_EUR);
    }

    function createPool(address tokenA, address tokenB) external {
        IUniswapV2Factory factory = IUniswapV2Factory(factoryAddress);

        factory.createPair(tokenA, tokenB);
        address pool = factory.getPair(tokenA, tokenB);

        require(pool != address(0), "Pool creation failed");
    }

    function getPairAddress(address tokenA, address tokenB)
        public
        view
        returns (address pairAddress)
    {
        pairAddress = IUniswapV2Factory(factoryAddress).getPair(tokenA, tokenB);

        require(pairAddress != address(0), "Pool does not exist yet, please create it");
    }

    function pairInfo(address tokenA, address tokenB)
        external
        view
        returns (uint reserveA, uint reserveB, uint totalSupply)
    {
        address pairAddress = getPairAddress(tokenA, tokenB);
        IUniswapV2Pair pair = IUniswapV2Pair(pairAddress);

        totalSupply = pair.totalSupply();
        
        (uint reserves0, uint reserves1,) = pair.getReserves();

        (reserveA, reserveB) = tokenA == pair.token0() ? (reserves0, reserves1) : (reserves1, reserves0);
    }

    // amountOutMin shoulb be retrieved from an oracle in order to prevent front-running
    function swapDaiForEur (uint _amount, uint amountOutMin) public {

        require(DAI.transferFrom(msg.sender, address(this), _amount), 'transferFrom failed.');
        require(DAI.approve(routerAddress, _amount), 'approve failed.');

        uint[] memory amounts;
        address[] memory path = new address[](2);
        path[0] = address(DAI);
        path[1] = address(EUR);
        amounts = IUniswapV2Router02(routerAddress).swapExactTokensForTokens(
            _amount,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        console.log('amount of EUR received: ', amounts[1]);
    }
}
