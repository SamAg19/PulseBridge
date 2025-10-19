// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {IPyth} from "./IPyth.sol";
import {IPythPriceConsumer} from "./IPythPriceConsumer.sol";

contract PythPriceConsumer is IPythPriceConsumer {
    IPyth public immutable pyth;

    // Pyth price feed IDs
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 public constant USDT_USD_PRICE_ID = 0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b;
    bytes32 public constant USDC_USD_PRICE_ID = 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a;
    bytes32 public constant PYUSD_USD_PRICE_ID = 0x3f9c88e4cc2f33c57c5d0897ea89c26d90ef4ff9cc442a20d1d71c0a7e7f9e46;

    // Maximum acceptable price age in seconds (fixed at 60 seconds)
    uint256 public constant MAX_PRICE_AGE = 60;

    constructor(address _pyth) {
        require(_pyth != address(0), "PythPriceConsumer: invalid pyth address");
        pyth = IPyth(_pyth);
    }

    /**
     * @notice Update price feeds and convert ETH to pyUSD
     * @param ethAmount Amount of ETH (in wei)
     * @param priceUpdateData Price update data from Pyth Price Service API
     * @return pyusdAmount Amount in pyUSD (with 6 decimals)
     *
     * @dev Fetches ETH/USD and pyUSD/USD prices, then calculates ETH to pyUSD conversion
     *      Formula: (ethAmount * ethUsdPrice) / pyUsdPrice
     */
    function getEthToPyusd(uint256 ethAmount, bytes[] calldata priceUpdateData)
        external
        payable
        returns (uint256 pyusdAmount)
    {
        uint256 updateFee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= updateFee, "PythPriceConsumer: insufficient update fee");

        pyth.updatePriceFeeds{value: updateFee}(priceUpdateData);

        IPyth.Price memory ethPrice = pyth.getPriceNoOlderThan(ETH_USD_PRICE_ID, MAX_PRICE_AGE);
        require(ethPrice.price > 0, "PythPriceConsumer: invalid ETH price");

        IPyth.Price memory pyusdPrice = pyth.getPriceNoOlderThan(PYUSD_USD_PRICE_ID, MAX_PRICE_AGE);
        require(pyusdPrice.price > 0, "PythPriceConsumer: invalid pyUSD price");

        uint256 ethUsdValue = (ethAmount * uint256(uint64(ethPrice.price))) / 1e18;

        pyusdAmount = (ethUsdValue * 1e6) / uint256(uint64(pyusdPrice.price));

        if (msg.value > updateFee) {
            payable(msg.sender).transfer(msg.value - updateFee);
        }

        return pyusdAmount;
    }

    /**
     * @notice Update price feeds and convert USDT to pyUSD
     * @param usdtAmount Amount of USDT (with 6 decimals)
     * @param priceUpdateData Price update data from Pyth Price Service API
     * @return pyusdAmount Amount in pyUSD (with 6 decimals)
     *
     * @dev Fetches USDT/USD and pyUSD/USD prices, then calculates USDT to pyUSD conversion
     */
    function getUsdtToPyusd(uint256 usdtAmount, bytes[] calldata priceUpdateData)
        external
        payable
        returns (uint256 pyusdAmount)
    {
        uint256 updateFee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= updateFee, "PythPriceConsumer: insufficient update fee");

        pyth.updatePriceFeeds{value: updateFee}(priceUpdateData);

        IPyth.Price memory usdtPrice = pyth.getPriceNoOlderThan(USDT_USD_PRICE_ID, MAX_PRICE_AGE);
        require(usdtPrice.price > 0, "PythPriceConsumer: invalid USDT price");

        IPyth.Price memory pyusdPrice = pyth.getPriceNoOlderThan(PYUSD_USD_PRICE_ID, MAX_PRICE_AGE);
        require(pyusdPrice.price > 0, "PythPriceConsumer: invalid pyUSD price");

        uint256 usdValue = (usdtAmount * uint256(uint64(usdtPrice.price))) / 1e6;

        pyusdAmount = (usdValue * 1e6) / uint256(uint64(pyusdPrice.price));

        if (msg.value > updateFee) {
            payable(msg.sender).transfer(msg.value - updateFee);
        }

        return pyusdAmount;
    }

    /**
     * @notice Update price feeds and convert USDC to pyUSD
     * @param usdcAmount Amount of USDC (with 6 decimals)
     * @param priceUpdateData Price update data from Pyth Price Service API
     * @return pyusdAmount Amount in pyUSD (with 6 decimals)
     *
     * @dev Fetches USDC/USD and pyUSD/USD prices, then calculates USDC to pyUSD conversion
     */
    function getUsdcToPyusd(uint256 usdcAmount, bytes[] calldata priceUpdateData)
        external
        payable
        returns (uint256 pyusdAmount)
    {
        uint256 updateFee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= updateFee, "PythPriceConsumer: insufficient update fee");

        pyth.updatePriceFeeds{value: updateFee}(priceUpdateData);

        IPyth.Price memory usdcPrice = pyth.getPriceNoOlderThan(USDC_USD_PRICE_ID, MAX_PRICE_AGE);
        require(usdcPrice.price > 0, "PythPriceConsumer: invalid USDC price");

        IPyth.Price memory pyusdPrice = pyth.getPriceNoOlderThan(PYUSD_USD_PRICE_ID, MAX_PRICE_AGE);
        require(pyusdPrice.price > 0, "PythPriceConsumer: invalid pyUSD price");

        uint256 usdValue = (usdcAmount * uint256(uint64(usdcPrice.price))) / 1e6;

        pyusdAmount = (usdValue * 1e6) / uint256(uint64(pyusdPrice.price));

        if (msg.value > updateFee) {
            payable(msg.sender).transfer(msg.value - updateFee);
        }

        return pyusdAmount;
    }

    /**
     * @notice Get the update fee for Pyth price updates
     * @param updateData The update data from Pyth
     * @return fee The fee in wei
     */
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 fee) {
        return pyth.getUpdateFee(updateData);
    }
}
