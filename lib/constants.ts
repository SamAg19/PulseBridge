// Contract addresses and configurations
export const chains: Record<number, Record<string, string>> = {
  // Hardhat localhost
  31337: {
    DoctorRegistry: "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707",
    ConsultationEscrow: "0x0165878a594ca255338adfa4d48449f69242eb8f",
    PYUSD: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
    USDC: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
    USDT: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
  },
  // Add other networks as needed
  // 11155111: { // Sepolia
  //   DoctorRegistry: "0x...",
  //   ConsultationEscrow: "0x...",
  //   PYUSD: "0x...",
  // },
};

// Standard ERC20 ABI
export const erc20Abi = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// DoctorRegistry ABI (basic functions needed)
export const DoctorRegistry = [
  {
    inputs: [{ name: "doctor", type: "address" }],
    name: "getDoctorID",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "stakeAmount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "depositFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "_name", type: "string" },
      { name: "_specialization", type: "string" },
      { name: "_profileDescription", type: "string" },
      { name: "_email", type: "string" },
      { name: "_consultationFee", type: "string" },
      { name: "_licenseNumber", type: "string" }
    ],
    name: "registerAsDoctor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// ConsultationEscrow ABI (placeholder - add functions as needed)
export const ConsultationEscrow = [
  // Add consultation escrow functions here as needed
] as const;