// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @dev Generic mock ERC20 token for testing (pyUSD, USDC, USDT)
 * @notice This is a test token with 6 decimals
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {
        // Mint 1 million tokens to deployer for initial liquidity
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function faucet(uint256 amount) external {
        require(amount <= 10_000 * 10**DECIMALS, "MockERC20: faucet limit 10k");
        _mint(msg.sender, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
