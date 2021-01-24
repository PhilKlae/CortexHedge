// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV3Interface.sol";

abstract contract PriceConsumer {
    /*
     * Network: Mainnet
     * Aggregator: ETH/USD
     * Address: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
     */
    AggregatorV3Interface internal priceFeed_eur_usd;
    AggregatorV3Interface internal priceFeed_dai_usd;

    function getEUROPrice() public view returns (int256) {
        (
            ,
            int256 price,
            ,
            uint256 timeStamp,
            
        ) = priceFeed_eur_usd.latestRoundData();
        // If the round is not complete yet, timestamp is 0
        require(timeStamp > 0, "Round not complete");
        return price;
    }

    function getDAIPrice() public view returns (int256) {
        (
            ,
            int256 price,
            ,
            uint256 timeStamp,
            
        ) = priceFeed_dai_usd.latestRoundData();
        // If the round is not complete yet, timestamp is 0
        require(timeStamp > 0, "Round not complete");
        return price;
    }
}
