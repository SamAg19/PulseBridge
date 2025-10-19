// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {IPyth} from "./../Oracle/IPyth.sol";

/**
 * @title MockPyth
 * @dev Mock implementation of Pyth oracle for testing PythPriceConsumer
 * @notice Implements only the functions required by IPyth interface
 */
contract MockPyth is IPyth {
    // Price feed ID => Price data
    mapping(bytes32 => Price) private prices;
    mapping(bytes32 => bool) private feedExists;

    // Simulated price update data per price feed
    mapping(bytes32 => int64) private nextPrice;
    mapping(bytes32 => uint64) private nextConf;
    mapping(bytes32 => bool) private hasPendingUpdate;

    uint256 private updateFeePerUpdate = 0.001 ether;

    // Price feed IDs (same as real Pyth)
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 public constant USDT_USD_PRICE_ID = 0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b;
    bytes32 public constant USDC_USD_PRICE_ID = 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a;
    bytes32 public constant PYUSD_USD_PRICE_ID = 0x3f9c88e4cc2f33c57c5d0897ea89c26d90ef4ff9cc442a20d1d71c0a7e7f9e46;

    event PriceUpdated(bytes32 indexed id, int64 price, uint64 conf, int32 expo, uint publishTime);

    constructor() {
        // Initialize ETH/USD price: $2500 with 8 decimals
        prices[ETH_USD_PRICE_ID] = Price({
            price: 250000000000, // $2500
            conf: 125000000,     // $1.25 confidence
            expo: -8,            // 8 decimals
            publishTime: block.timestamp
        });
        feedExists[ETH_USD_PRICE_ID] = true;

        // Initialize USDT/USD price: $1.00 with 8 decimals
        prices[USDT_USD_PRICE_ID] = Price({
            price: 100000000,    // $1.00
            conf: 50000,         // $0.0005 confidence
            expo: -8,            // 8 decimals
            publishTime: block.timestamp
        });
        feedExists[USDT_USD_PRICE_ID] = true;

        // Initialize USDC/USD price: $1.00 with 8 decimals
        prices[USDC_USD_PRICE_ID] = Price({
            price: 100000000,    // $1.00
            conf: 50000,         // $0.0005 confidence
            expo: -8,            // 8 decimals
            publishTime: block.timestamp
        });
        feedExists[USDC_USD_PRICE_ID] = true;

        // Initialize pyUSD/USD price: $1.00 with 8 decimals
        prices[PYUSD_USD_PRICE_ID] = Price({
            price: 100000000,    // $1.00
            conf: 50000,         // $0.0005 confidence
            expo: -8,            // 8 decimals
            publishTime: block.timestamp
        });
        feedExists[PYUSD_USD_PRICE_ID] = true;
    }

    /**
     * @notice Stage a price update that will be applied on next updatePriceFeeds call
     * @param priceId Price feed identifier
     * @param newPrice New price value (in Pyth format with 8 decimals)
     * @param newConf New confidence interval
     * @dev This simulates fetching data from Pyth's off-chain API
     */
    function stagePriceUpdate(bytes32 priceId, int64 newPrice, uint64 newConf) external {
        require(feedExists[priceId], "MockPyth: price feed not found");
        nextPrice[priceId] = newPrice;
        nextConf[priceId] = newConf;
        hasPendingUpdate[priceId] = true;
    }

    /**
     * @inheritdoc IPyth
     */
    function getPriceNoOlderThan(bytes32 id, uint age) external view override returns (Price memory price) {
        require(feedExists[id], "MockPyth: price feed not found");
        Price memory currentPrice = prices[id];
        require(block.timestamp - currentPrice.publishTime <= age, "MockPyth: price too old");
        return currentPrice;
    }

    /**
     * @inheritdoc IPyth
     * @dev Updates prices for all price feeds if there are staged updates, otherwise just refreshes timestamps
     */
    function updatePriceFeeds(bytes[] calldata updateData) external payable override {
        require(msg.value >= getUpdateFee(updateData), "MockPyth: insufficient fee");

        // Update all price feeds
        _updatePriceFeed(ETH_USD_PRICE_ID);
        _updatePriceFeed(USDT_USD_PRICE_ID);
        _updatePriceFeed(USDC_USD_PRICE_ID);
        _updatePriceFeed(PYUSD_USD_PRICE_ID);
    }

    /**
     * @dev Internal helper to update a single price feed
     */
    function _updatePriceFeed(bytes32 priceId) private {
        if (feedExists[priceId]) {
            // If there's a staged price update, apply it
            if (hasPendingUpdate[priceId]) {
                prices[priceId].price = nextPrice[priceId];
                prices[priceId].conf = nextConf[priceId];
                hasPendingUpdate[priceId] = false;
            }

            // Always update timestamp to mark as fresh
            prices[priceId].publishTime = block.timestamp;

            emit PriceUpdated(
                priceId,
                prices[priceId].price,
                prices[priceId].conf,
                prices[priceId].expo,
                block.timestamp
            );
        }
    }

    /**
     * @inheritdoc IPyth
     */
    function getUpdateFee(bytes[] calldata updateData) public view override returns (uint feeAmount) {
        return updateData.length * updateFeePerUpdate;
    }
}
