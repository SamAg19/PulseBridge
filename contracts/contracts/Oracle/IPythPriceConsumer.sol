// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

interface IPythPriceConsumer {
    function getEthToUsd(uint256 ethAmount, bytes[] calldata priceUpdateData) external payable returns (uint256);
    function getUpdateFee(bytes[] calldata priceUpdateData) external returns (uint256);
}
