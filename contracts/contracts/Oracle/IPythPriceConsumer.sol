// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

interface IPythPriceConsumer {
    function getEthToPyusd(uint256 ethAmount, bytes[] calldata priceUpdateData) external payable returns (uint256);
    function getUsdtToPyusd(uint256 usdtAmount, bytes[] calldata priceUpdateData) external payable returns (uint256);
    function getUsdcToPyusd(uint256 usdcAmount, bytes[] calldata priceUpdateData) external payable returns (uint256);
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256);

}
