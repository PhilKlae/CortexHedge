pragma solidity ^0.6.6;

// import './interfaces/ILiquidityValueCalculator.sol';
import "hardhat/console.sol";

import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';

contract UniswapConnector {
    address public factory;

    constructor(address factory_) public {
        factory = factory_;
    }

    function getPairAddress(address tokenA, address tokenB)
        public
        returns (address pairAddress)
    {
        pairAddress = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        if (pairAddress == address(0)) {
            console.log('Pair not found, creating it');
            IUniswapV2Factory(factory).createPair(tokenA, tokenB);
            pairAddress = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        }
    }

    // function addLiquidity

    function pairInfo(address tokenA, address tokenB)
        private
        returns (uint reserveA, uint reserveB, uint totalSupply)
    {
        address pairAddress = getPairAddress(tokenA, tokenB);
        IUniswapV2Pair pair = IUniswapV2Pair(pairAddress);

        totalSupply = pair.totalSupply();
        
        (uint reserves0, uint reserves1,) = pair.getReserves();

        console.log(totalSupply, reserves0, reserves1);

        (reserveA, reserveB) = tokenA == pair.token0() ? (reserves0, reserves1) : (reserves1, reserves0);
    }

    function computeLiquidityShareValue(
        uint liquidity,
        address tokenA,
        address tokenB
    )
        external
        returns (uint tokenAAmount, uint tokenBAmount)
    {
        (uint reserveA, uint reserveB, uint totalSupply) = pairInfo(tokenA, tokenB);
        uint tokenAAmount = reserveA;
        uint tokenBAmount = reserveB;
        // revert('TODO');
    }

    // I need to retrieve the price of DAI/ETH before making the swap, to preevent front running
    // function swapToken (uint _amount) {
    //     uint amountIn = _amount * 10 ** DAI.decimals();
    //     require(DAI.transferFrom(msg.sender, address(this), amountIn), 'transferFrom failed.');
    //     require(DAI.approve(address(UniswapV2Router02), amountIn), 'approve failed.');

    //     // amountOutMin must be retrieved from an oracle of some kind
    //     address[] memory path = new address[](2);
    //     path[0] = address(DAI);
    //     path[1] = UniswapV2Router02.WETH();
    //     UniswapV2Router02.swapExactTokensForETH(amountIn, amountOutMin, path, msg.sender, block.timestamp);
    // }
}
