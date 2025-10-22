/**
 * Main deployment script for PulseBridge contracts
 * Supports both mock contracts (local/test) and real contracts (Sepolia)
 *
 * Usage:
 * - Mock deployment: USE_MOCKS=true npx hardhat run scripts/deploy.ts --network localhost
 * - Sepolia deployment: npx hardhat run scripts/deploy.ts --network sepolia
 */

import { network } from "hardhat";
import { formatEther } from "viem";
import { SEPOLIA_CONFIG, DEFAULT_DEPLOYMENT_PARAMS } from "./config.js";

interface DeploymentAddresses {
  pyusd: `0x${string}`;
  usdc: `0x${string}`;
  usdt: `0x${string}`;
  pyth: `0x${string}`;
}

async function deployMockContracts(viem: any): Promise<DeploymentAddresses> {
  console.log("Deploying mock contracts for testing...");

  // Deploy MockERC20 for PYUSD
  console.log("  Deploying MockERC20 (PYUSD)...");
  const pyusdContract = await viem.deployContract("MockERC20", [
    "PayPal USD",
    "PYUSD",
  ]);
  console.log("  PYUSD deployed to:", pyusdContract.address);

  // Deploy MockERC20 for USDC
  console.log("  Deploying MockERC20 (USDC)...");
  const usdcContract = await viem.deployContract("MockERC20", [
    "USD Coin",
    "USDC",
  ]);
  console.log("  USDC deployed to:", usdcContract.address);

  // Deploy MockERC20 for USDT
  console.log("  Deploying MockERC20 (USDT)...");
  const usdtContract = await viem.deployContract("MockERC20", [
    "Tether USD",
    "USDT",
  ]);
  console.log("  USDT deployed to:", usdtContract.address);

  // Deploy MockPyth
  console.log("  Deploying MockPyth...");
  const mockPythContract = await viem.deployContract("MockPyth", []);
  console.log("  MockPyth deployed to:", mockPythContract.address);

  return {
    pyusd: pyusdContract.address,
    usdc: usdcContract.address,
    usdt: usdtContract.address,
    pyth: mockPythContract.address,
  };
}

async function getContractAddresses(useMocks: boolean, viem: any, publicClient: any): Promise<DeploymentAddresses> {
  if (useMocks) {
    return await deployMockContracts(viem);
  }

  // Validate network is Sepolia
  const chainId = await publicClient.getChainId();

  if (chainId !== 11155111) { // Sepolia chain ID
    throw new Error(
      `Invalid network: Expected Sepolia (chain ID: 11155111) but got chain ID: ${chainId}. ` +
      `Real contract addresses are only configured for Sepolia testnet. ` +
      `Use USE_MOCKS=true for other networks.`
    );
  }

  console.log("Using Sepolia testnet contract addresses...");
  return {
    pyusd: SEPOLIA_CONFIG.pyusd as `0x${string}`,
    usdc: SEPOLIA_CONFIG.usdc as `0x${string}`,
    usdt: SEPOLIA_CONFIG.usdt as `0x${string}`,
    pyth: SEPOLIA_CONFIG.pyth as `0x${string}`,
  };
}

console.log("===========================================");
console.log("PulseBridge Contracts Deployment");
console.log("===========================================");

const useMocks = process.env.USE_MOCKS === "true";
console.log("Use Mock Contracts:", useMocks);
console.log("-----------------------------------");

// Connect to network and get viem helpers
const { viem } = await network.connect();
const networkName = process.env.HARDHAT_NETWORK || "localhost";
console.log("Network:", networkName);

const [deployer] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

console.log("Deployer address:", deployer.account.address);
const balance = await publicClient.getBalance({ address: deployer.account.address });
console.log("Deployer balance:", formatEther(balance), "ETH");
console.log("-----------------------------------\n");

// Get contract addresses (either deploy mocks or use Sepolia addresses)
const addresses = await getContractAddresses(useMocks, viem, publicClient);

console.log("\nToken & Oracle Addresses:");
console.log("  PYUSD:", addresses.pyusd);
console.log("  USDC:", addresses.usdc);
console.log("  USDT:", addresses.usdt);
console.log("  Pyth Oracle:", addresses.pyth);
console.log("-----------------------------------\n");

// 1. Deploy PythPriceConsumer
console.log("1. Deploying PythPriceConsumer...");
const pythPriceConsumer = await viem.deployContract("PythPriceConsumer", [
  addresses.pyth,
]);
console.log("   PythPriceConsumer deployed to:", pythPriceConsumer.address);

// 2. Deploy DoctorRegistry
console.log("\n2. Deploying DoctorRegistry...");
const doctorRegistry = await viem.deployContract("DoctorRegistry", [
  deployer.account.address, // owner
  DEFAULT_DEPLOYMENT_PARAMS.doctorRegistry.depositFee,
  DEFAULT_DEPLOYMENT_PARAMS.doctorRegistry.stakeAmount,
  addresses.pyusd, // deposit token
]);
console.log("   DoctorRegistry deployed to:", doctorRegistry.address);

// 3. Deploy ConsultationEscrow
console.log("\n3. Deploying ConsultationEscrow...");
const consultationEscrow = await viem.deployContract("ConsultationEscrow", [
  doctorRegistry.address,
  pythPriceConsumer.address,
  addresses.pyusd,
  addresses.usdc,
  addresses.usdt,
]);
console.log("   ConsultationEscrow deployed to:", consultationEscrow.address);

console.log("\n===========================================");
console.log("Deployment Summary");
console.log("===========================================");
console.log("Network:", networkName);
console.log("Chain ID:", await publicClient.getChainId());
console.log("Using Mocks:", useMocks);
console.log("-----------------------------------");
console.log("Infrastructure:");
console.log("  PYUSD:", addresses.pyusd);
console.log("  USDC:", addresses.usdc);
console.log("  USDT:", addresses.usdt);
console.log("  Pyth Oracle:", addresses.pyth);
console.log("-----------------------------------");
console.log("PulseBridge Contracts:");
console.log("  PythPriceConsumer:", pythPriceConsumer.address);
console.log("  DoctorRegistry:", doctorRegistry.address);
console.log("  ConsultationEscrow:", consultationEscrow.address);
console.log("-----------------------------------");
console.log("Deployment Parameters:");
console.log("  Doctor Deposit Fee:", DEFAULT_DEPLOYMENT_PARAMS.doctorRegistry.depositFee.toString(), "PYUSD (raw)");
console.log("  Doctor Stake Amount:", DEFAULT_DEPLOYMENT_PARAMS.doctorRegistry.stakeAmount.toString(), "PYUSD (raw)");
console.log("===========================================\n");

// Save deployment info
const fs = await import("fs");
const deploymentInfo = {
  network: networkName,
  chainId: await publicClient.getChainId(),
  timestamp: new Date().toISOString(),
  deployer: deployer.account.address,
  useMocks,
  infrastructure: {
    pyusd: addresses.pyusd,
    usdc: addresses.usdc,
    usdt: addresses.usdt,
    pythOracle: addresses.pyth,
  },
  contracts: {
    pythPriceConsumer: pythPriceConsumer.address,
    doctorRegistry: doctorRegistry.address,
    consultationEscrow: consultationEscrow.address,
  },
  parameters: {
    doctorDepositFee: DEFAULT_DEPLOYMENT_PARAMS.doctorRegistry.depositFee.toString(),
    doctorStakeAmount: DEFAULT_DEPLOYMENT_PARAMS.doctorRegistry.stakeAmount.toString(),
  },
};

const networkSuffix = useMocks ? `${networkName}-mocks` : networkName;
const deploymentPath = `deployments/${networkSuffix}.json`;
fs.mkdirSync("deployments", { recursive: true });
fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
console.log(`Deployment info saved to: ${deploymentPath}\n`);

// If using mocks, provide helpful faucet commands
if (useMocks) {
  console.log("===========================================");
  console.log("Mock Token Faucet Commands");
  console.log("===========================================");
  console.log("To get test tokens, you can call the faucet() function:");
  console.log(`  PYUSD: await contract.faucet(10000000000n) // 10,000 PYUSD`);
  console.log(`  USDC:  await contract.faucet(10000000000n) // 10,000 USDC`);
  console.log(`  USDT:  await contract.faucet(10000000000n) // 10,000 USDT`);
  console.log("===========================================\n");
}
