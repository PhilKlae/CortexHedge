pragma solidity ^0.6.6;

// import './interfaces/ILiquidityValueCalculator.sol';
import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';

interface ILiquidityValueCalculator {
    function computeLiquidityShareValue(uint liquidity, address tokenA, address tokenB) external returns (uint tokenAAmount, uint tokenBAmount);
}

contract UniswapConnector is ILiquidityValueCalculator {
    address public factory;
    constructor(address factory_) public {
        factory = factory_;
    }

    function pairInfo(address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB, uint totalSupply) {
        IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, tokenA, tokenB));
        if (pair == address(0)) {
            IUniswapV2Factory(factory).createPair(tokenA, tokenB);
        }
        totalSupply = pair.totalSupply();
        (uint reserves0, uint reserves1,) = pair.getReserves();
        (reserveA, reserveB) = tokenA == pair.token0() ? (reserves0, reserves1) : (reserves1, reserves0);
    }

    function computeLiquidityShareValue(uint liquidity, address tokenA, address tokenB) external override returns (uint tokenAAmount, uint tokenBAmount) {
        revert('TODO');
    }

    // I need to retrieve the price of DAI/ETH before making the swap, to preevent front running
    function swapToken (uint _amount) {
        uint amountIn = _amount * 10 ** DAI.decimals();
        require(DAI.transferFrom(msg.sender, address(this), amountIn), 'transferFrom failed.');
        require(DAI.approve(address(UniswapV2Router02), amountIn), 'approve failed.');

        // amountOutMin must be retrieved from an oracle of some kind
        address[] memory path = new address[](2);
        path[0] = address(DAI);
        path[1] = UniswapV2Router02.WETH();
        UniswapV2Router02.swapExactTokensForETH(amountIn, amountOutMin, path, msg.sender, block.timestamp);
    }
}
