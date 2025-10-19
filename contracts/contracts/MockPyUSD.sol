// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPyUSD
 * @dev Mock implementation of PayPal USD (pyUSD) for testing
 * @notice This is a test token with 6 decimals to match real pyUSD
 */
contract MockPyUSD is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20("PayPal USD", "pyUSD") Ownable(msg.sender) {
        // Mint 1 million pyUSD to deployer for initial liquidity
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }

    /**
     * @dev Returns 6 decimals to match real pyUSD
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Allows owner to mint tokens for testing purposes
     * @param to Address to receive minted tokens
     * @param amount Amount to mint (in base units with 6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Allows anyone to mint tokens to themselves for testing
     * @param amount Amount to mint (in base units with 6 decimals)
     * @notice Only for testing - would not exist in production
     */
    function faucet(uint256 amount) external {
        require(amount <= 10_000 * 10**DECIMALS, "MockPyUSD: faucet limit 10k");
        _mint(msg.sender, amount);
    }

    /**
     * @dev Burns tokens from caller's balance
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
