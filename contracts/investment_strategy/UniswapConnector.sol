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
    IERC20 public TokenA;
    IERC20 public TokenB;

    constructor(address _factory, address _router, address _TokenA, address _TokenB) public {
        factoryAddress = _factory;
        routerAddress = _router;
        TokenA = IERC20(_TokenA);
        TokenB = IERC20(_TokenB);
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
    function swapAForB (uint _amountIn, uint amountOutMin)
        public
        returns (uint amountOut)
    {

        require(TokenA.transferFrom(msg.sender, address(this), _amountIn), 'transferFrom failed.');
        require(TokenA.approve(routerAddress, _amountIn), 'approve failed.');

        uint[] memory amounts;
        address[] memory path = new address[](2);
        path[0] = address(TokenA);
        path[1] = address(TokenB);
        amounts = IUniswapV2Router02(routerAddress).swapExactTokensForTokens(
            _amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        amountOut = amounts[1];
        console.log('amount of TokenB received: ', amountOut);
    }

    function swapBForA (uint _amountIn, uint amountOutMin)
        public
        returns (uint amountOut)
    {

        require(TokenB.transferFrom(msg.sender, address(this), _amountIn), 'transferFrom failed.');
        require(TokenB.approve(routerAddress, _amountIn), 'approve failed.');

        uint[] memory amounts;
        address[] memory path = new address[](2);
        path[0] = address(TokenB);
        path[1] = address(TokenA);
        amounts = IUniswapV2Router02(routerAddress).swapExactTokensForTokens(
            _amountIn,
            amountOutMin,
            path,
            msg.sender,
            block.timestamp
        );

        amountOut = amounts[1];
        console.log('amount of TokenA received: ', amountOut);
    }
}
