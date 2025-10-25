/**
 * Deployment configuration for PulseBridge contracts
 * Sepolia testnet addresses for USDT, USDC, PYUSD, and Pyth Oracle
 */

export interface NetworkConfig {
  usdt: string;
  usdc: string;
  pyusd: string;
  pyth: string;
}

// Sepolia Testnet Addresses
export const SEPOLIA_CONFIG: NetworkConfig = {
  // USDT on Sepolia - Aave Faucet USDT
  usdt: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",

  // USDC on Sepolia - Aave Faucet USDC
  usdc: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",

  // PYUSD on Sepolia - PayPal USD
  pyusd: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",

  // Pyth Oracle on Sepolia
  pyth: "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21",
};

// Deployment parameters
export interface DeploymentParams {
  doctorRegistry: {
    depositFee: bigint;
    stakeAmount: bigint;
  };
}

export const DEFAULT_DEPLOYMENT_PARAMS: DeploymentParams = {
  doctorRegistry: {
    // 1 PYUSD deposit fee (6 decimals)
    depositFee: 1_000_000n,
    // 3 PYUSD stake amount (6 decimals)
    stakeAmount: 3_000_000n,
  },
};
