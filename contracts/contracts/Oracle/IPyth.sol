// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

/**
 * @title IPyth
 * @dev Interface for Pyth Network price oracle
 * @notice Based on Pyth Network's actual interface
 */
interface IPyth {
    /// @dev Represents a price with confidence interval
    struct Price {
        // Price value (e.g., for ETH/USD, this would be price in USD * 10^expo)
        int64 price;
        // Confidence interval around the price
        uint64 conf;
        // Price exponent (e.g., -8 means price is in units of 10^-8)
        int32 expo;
        // Unix timestamp of when the price was published
        uint publishTime;
    }

    /// @dev Represents a full price feed with EMA
    struct PriceFeed {
        // Unique identifier for this price feed
        bytes32 id;
        // Latest available price
        Price price;
        // Exponentially-weighted moving average price
        Price emaPrice;
    }

    /**
     * @notice Returns the price that is no older than the given age
     * @param id The price feed identifier
     * @param age Maximum age of the price in seconds
     * @return price The price data
     */
    function getPriceNoOlderThan(bytes32 id, uint age) external view returns (Price memory price);

    /**
     * @notice Updates price feeds with the given data
     * @param updateData Array of price update data from Pyth
     */
    function updatePriceFeeds(bytes[] calldata updateData) external payable;

    /**
     * @notice Returns the required fee for updating price feeds
     * @param updateData Array of price update data
     * @return feeAmount The fee in wei
     */
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint feeAmount);
}
