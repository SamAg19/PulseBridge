// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {IPyth} from "./IPyth.sol";

contract PythPriceConsumer {
    IPyth public immutable pyth;

    // ETH/USD Pyth price feed ID
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    constructor(address _pyth) {
        require(_pyth != address(0), "PythPriceConsumer: invalid pyth address");
        pyth = IPyth(_pyth);
    }

    /**
     * @notice Update price feeds and convert ETH to USD using the latest price
     * @param ethAmount Amount of ETH (in wei)
     * @param priceUpdateData Price update data from Pyth Price Service API
     * @return usdAmount Amount in USD (with 6 decimals to match pyUSD)
     */
    function getEthToUsd(uint256 ethAmount, bytes[] calldata priceUpdateData)
        external
        payable
        returns (uint256 usdAmount)
    {
        uint256 updateFee = pyth.getUpdateFee(priceUpdateData);
        require(msg.value >= updateFee, "PythPriceConsumer: insufficient update fee");

        pyth.updatePriceFeeds{value: updateFee}(priceUpdateData);

        IPyth.Price memory pythPrice = pyth.getPriceNoOlderThan(ETH_USD_PRICE_ID, 60);

        require(pythPrice.price > 0, "PythPriceConsumer: invalid price");

        uint256 priceValue = uint256(uint64(pythPrice.price));
        usdAmount = (ethAmount * priceValue) / 1e20;

        if (msg.value > updateFee) {
            payable(msg.sender).transfer(msg.value - updateFee);
        }

        return usdAmount;
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
