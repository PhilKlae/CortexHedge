// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3DAIEUR {
    AggregatorV3Interface internal priceFeed_eur_usd;

    /*
     * Network: Mainnet
     * Aggregator: EUR/USD
     * Address: 0xb49f677943BC038e9857d61E7d053CaA2C1734C1
     */
    /*
     * Network: Kovan
     * Aggregator: EUR/USD
     * Address: 0x0c15Ab9A0DB086e062194c273CC79f41597Bbf13
     */

    AggregatorV3Interface internal priceFeed_dai_usd;

    /*
     * Network: Mainnet
     * Aggregator: DAI/USD
     * Address: 0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9
     */
    /* Network: Kovan
     * Aggregator: DAI/USD
     * Address: 0x777A68032a88E5A84678A77Af2CD65A7b3c0775a
     */

    constructor() public {
        priceFeed_dai_usd = AggregatorV3Interface(
            0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9
        );
        priceFeed_eur_usd = AggregatorV3Interface(
            0xb49f677943BC038e9857d61E7d053CaA2C1734C1
        );
    }

    /**
     * Returns the latest price
     */
    function getDAIPrice() public view returns (int256) {
        (, int256 price, , uint256 timeStamp, ) =
            priceFeed_dai_usd.latestRoundData();
        // If the round is not complete yet, timestamp is 0
        require(timeStamp > 0, "Round not complete");
        return price;
    }

    function getEUROPrice() public view returns (int256) {
        (, int256 price, , uint256 timeStamp, ) =
            priceFeed_eur_usd.latestRoundData();
        // If the round is not complete yet, timestamp is 0
        require(timeStamp > 0, "Round not complete");
        return price;
    }
}

contract DerivedPriceOracle is PriceConsumerV3DAIEUR {
    constructor() PriceConsumerV3DAIEUR() {}
}