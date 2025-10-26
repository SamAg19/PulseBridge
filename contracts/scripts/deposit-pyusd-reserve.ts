/**
 * Script to deposit PYUSD to ConsultationEscrow reserve
 * Supports Sepolia deployments only
 *
 * Usage:
 * npx hardhat run scripts/deposit-pyusd-reserve.ts --network sepolia
 *
 * Environment variables required:
 * - SEPOLIA_RPC_URL: Sepolia RPC endpoint
 * - SEPOLIA_PRIVATE_KEY: Private key of account with PYUSD balance
 * - DEPOSIT_AMOUNT: Amount of PYUSD to deposit (in human-readable format, e.g., "100" for 100 PYUSD)
 */

import { network } from "hardhat";
import { formatUnits, parseUnits } from "viem";
import * as fs from "fs";
import * as path from "path";

// Validate network is Sepolia
async function validateNetwork(publicClient: any) {
    const chainId = await publicClient.getChainId();
    if (chainId !== 11155111) {
        throw new Error(
            `This script only supports Sepolia testnet (chain ID: 11155111). ` +
            `Current network has chain ID: ${chainId}`
        );
    }
}

// Load deployment addresses
function loadDeploymentAddresses() {
    const deploymentPath = path.join(process.cwd(), "deployments", "sepolia.json");

    if (!fs.existsSync(deploymentPath)) {
        throw new Error(
            `Deployment file not found at ${deploymentPath}. ` +
            `Please deploy contracts first using: npx hardhat run scripts/deploy.ts --network sepolia`
        );
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
    return {
        consultationEscrow: deployment.contracts.consultationEscrow as `0x${string}`,
        pyusd: deployment.infrastructure.pyusd as `0x${string}`,
    };
}

console.log("===========================================");
console.log("Deposit PYUSD to ConsultationEscrow Reserve");
console.log("===========================================\n");

// Connect to network
const { viem } = await network.connect();
const networkName = process.env.HARDHAT_NETWORK || "localhost";
console.log("Network:", networkName);

const [depositor] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

// Validate Sepolia network
await validateNetwork(publicClient);

console.log("Depositor address:", depositor.account.address);
const ethBalance = await publicClient.getBalance({ address: depositor.account.address });
console.log("ETH balance:", formatUnits(ethBalance, 18), "ETH");
console.log("-----------------------------------\n");

// Load deployment addresses
const addresses = loadDeploymentAddresses();
console.log("Contract Addresses:");
console.log("  ConsultationEscrow:", addresses.consultationEscrow);
console.log("  PYUSD:", addresses.pyusd);
console.log("-----------------------------------\n");

// Get PYUSD contract
const pyusdContract = await viem.getContractAt("IERC20", addresses.pyusd);

// Check PYUSD balance
const pyusdBalance = await pyusdContract.read.balanceOf([depositor.account.address]) as bigint;
console.log("Current PYUSD balance:", formatUnits(pyusdBalance, 6), "PYUSD");

// Get deposit amount from environment variable or use default
const depositAmountStr = process.env.DEPOSIT_AMOUNT || "30";
const depositAmount = parseUnits(depositAmountStr, 6); // PYUSD has 6 decimals

console.log("Deposit amount:", formatUnits(depositAmount, 6), "PYUSD");

// Validate sufficient balance
if (pyusdBalance < depositAmount) {
    throw new Error(
        `Insufficient PYUSD balance. ` +
        `Required: ${formatUnits(depositAmount, 6)} PYUSD, ` +
        `Available: ${formatUnits(pyusdBalance, 6)} PYUSD`
    );
}

console.log("-----------------------------------\n");

// Get ConsultationEscrow contract
const escrowContract = await viem.getContractAt(
    "ConsultationEscrow",
    addresses.consultationEscrow
);

// Check current reserve balance
const currentReserve = await escrowContract.read.pyUSDReserveBalance() as bigint;
console.log("Current reserve balance:", formatUnits(currentReserve, 6), "PYUSD");

// Step 1: Approve PYUSD spending
console.log("\nStep 1: Approving PYUSD spending...");
const approveTx = await pyusdContract.write.approve([
    addresses.consultationEscrow,
    depositAmount,
]);
console.log("  Approval transaction:", approveTx);

// Wait for approval confirmation
const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTx });
console.log("  Approval confirmed in block:", approvalReceipt.blockNumber);

// Step 2: Deposit PYUSD to reserve
console.log("\nStep 2: Depositing PYUSD to reserve...");
const depositTx = await escrowContract.write.depositPyusdReserve([depositAmount]);
console.log("  Deposit transaction:", depositTx);

// Wait for deposit confirmation
const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: depositTx });
console.log("  Deposit confirmed in block:", depositReceipt.blockNumber);

// Check new reserve balance
const newReserve = await escrowContract.read.pyUSDReserveBalance() as bigint;
const newPyusdBalance = await pyusdContract.read.balanceOf([depositor.account.address]) as bigint;

console.log("\n===========================================");
console.log("Deposit Summary");
console.log("===========================================");
console.log("Network:", networkName);
console.log("Depositor:", depositor.account.address);
console.log("-----------------------------------");
console.log("Deposit Details:");
console.log("  Amount deposited:", formatUnits(depositAmount, 6), "PYUSD");
console.log("  Approval tx:", approveTx);
console.log("  Deposit tx:", depositTx);
console.log("-----------------------------------");
console.log("Reserve Balance:");
console.log("  Before:", formatUnits(currentReserve, 6), "PYUSD");
console.log("  After:", formatUnits(newReserve, 6), "PYUSD");
console.log("  Increase:", formatUnits(newReserve - currentReserve, 6), "PYUSD");
console.log("-----------------------------------");
console.log("Your PYUSD Balance:");
console.log("  Before:", formatUnits(pyusdBalance, 6), "PYUSD");
console.log("  After:", formatUnits(newPyusdBalance, 6), "PYUSD");
console.log("===========================================\n");
