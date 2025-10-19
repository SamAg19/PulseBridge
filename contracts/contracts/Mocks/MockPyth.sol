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

    // Simulated price update data
    int64 private nextPrice;
    uint64 private nextConf;
    bool private hasPendingUpdate;

    uint256 private updateFeePerUpdate = 0.001 ether;

    // ETH/USD price feed ID (same as real Pyth)
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    event PriceUpdated(bytes32 indexed id, int64 price, uint64 conf, int32 expo, uint publishTime);

    constructor() {
        // Initialize with a default ETH/USD price: $2500 with 8 decimals
        prices[ETH_USD_PRICE_ID] = Price({
            price: 250000000000, // $2500
            conf: 125000000,     // $1.25 confidence
            expo: -8,            // 8 decimals
            publishTime: block.timestamp
        });

        feedExists[ETH_USD_PRICE_ID] = true;
    }

    /**
     * @notice Stage a price update that will be applied on next updatePriceFeeds call
     * @param newPrice New price value (in Pyth format with 8 decimals)
     * @param newConf New confidence interval
     * @dev This simulates fetching data from Pyth's off-chain API
     */
    function stagePriceUpdate(int64 newPrice, uint64 newConf) external {
        nextPrice = newPrice;
        nextConf = newConf;
        hasPendingUpdate = true;
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
     * @dev Updates the price if there's a staged update, otherwise just refreshes timestamp
     */
    function updatePriceFeeds(bytes[] calldata updateData) external payable override {
        require(msg.value >= getUpdateFee(updateData), "MockPyth: insufficient fee");

        if (feedExists[ETH_USD_PRICE_ID]) {
            // If there's a staged price update, apply it
            if (hasPendingUpdate) {
                prices[ETH_USD_PRICE_ID].price = nextPrice;
                prices[ETH_USD_PRICE_ID].conf = nextConf;
                hasPendingUpdate = false;
            }

            // Always update timestamp to mark as fresh
            prices[ETH_USD_PRICE_ID].publishTime = block.timestamp;

            emit PriceUpdated(
                ETH_USD_PRICE_ID,
                prices[ETH_USD_PRICE_ID].price,
                prices[ETH_USD_PRICE_ID].conf,
                prices[ETH_USD_PRICE_ID].expo,
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
