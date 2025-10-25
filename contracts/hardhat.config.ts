import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { config as dotenvConfig } from "dotenv";

// Load environment variables from .env file
dotenvConfig();

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.30",
      },
      production: {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
   verify: {
    etherscan: {
      apiKey:  process.env.ETHERSCAN_API_KEY || "",
    },
  },


  networks: {
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
  },
};

export default config;
