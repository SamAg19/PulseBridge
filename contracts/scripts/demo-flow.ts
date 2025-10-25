/**
 * Demo Flow Script: Doctor Registration and Patient Consultation
 *
 * This script demonstrates the complete flow:
 * 1. Doctor registers with deposit and stake
 * 2. Admin approves the doctor
 * 3. Patient deposits PYUSD reserve to escrow
 * 4. Patient creates a consultation session paying in PYUSD
 *
 * Usage:
 * - Mock deployment: USE_MOCKS=true npx hardhat run scripts/demo-flow.ts --network localhost
 * - Sepolia deployment: npx hardhat run scripts/demo-flow.ts --network sepolia
 */

import { network } from "hardhat";
import { formatUnits, parseUnits } from "viem";
import * as fs from "fs";

async function loadDeploymentInfo() {
  const useMocks = process.env.USE_MOCKS === "true";
  const networkName = process.env.HARDHAT_NETWORK || "localhost";
  const networkSuffix = useMocks ? `${networkName}-mocks` : networkName;
  const deploymentPath = `deployments/${networkSuffix}.json`;

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      `Deployment file not found: ${deploymentPath}\n` +
      `Please deploy contracts first using: USE_MOCKS=${useMocks} npx hardhat run scripts/deploy.ts --network ${networkName}`
    );
  }

  return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
}

console.log("===========================================");
console.log("PulseBridge Demo Flow");
console.log("===========================================\n");

// Load deployment information
const deploymentInfo = await loadDeploymentInfo();
console.log("Loaded deployment:", deploymentInfo.network);
console.log("Using Mocks:", deploymentInfo.useMocks);
console.log("-----------------------------------\n");

// Connect to network
const { viem } = await network.connect();
const [deployer, doctor, patient] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

console.log("Accounts:");
console.log("  Deployer:", deployer.account.address);
console.log("  Doctor:", doctor.account.address);
console.log("  Patient:", patient.account.address);
console.log("-----------------------------------\n");

// Get contract instances
const pyusdContract = await viem.getContractAt(
  "MockERC20",
  deploymentInfo.infrastructure.pyusd
);

const doctorRegistryContract = await viem.getContractAt(
  "DoctorRegistry",
  deploymentInfo.contracts.doctorRegistry
);

const consultationEscrowContract = await viem.getContractAt(
  "ConsultationEscrow",
  deploymentInfo.contracts.consultationEscrow
);

console.log("Contract Instances Loaded:");
console.log("  PYUSD:", pyusdContract.address);
console.log("  DoctorRegistry:", doctorRegistryContract.address);
console.log("  ConsultationEscrow:", consultationEscrowContract.address);
console.log("-----------------------------------\n");

// ============================================
// STEP 1: Mint tokens if using mocks
// ============================================
if (deploymentInfo.useMocks) {
  console.log("STEP 1: Minting Mock PYUSD Tokens");
  console.log("-----------------------------------");
  console.log("Note: Faucet limit is 10,000 PYUSD per call\n");

  // Mint PYUSD for doctor (for registration stake)
  const doctorMintAmount = parseUnits("10000", 6); // 10,000 PYUSD (max per faucet call)
  console.log(`Minting ${formatUnits(doctorMintAmount, 6)} PYUSD for doctor...`);
  await pyusdContract.write.faucet([doctorMintAmount], {
    account: doctor.account,
  });

  // Mint PYUSD for patient (for consultation payment)
  const patientMintAmount = parseUnits("5000", 6); // 5,000 PYUSD
  console.log(`Minting ${formatUnits(patientMintAmount, 6)} PYUSD for patient...`);
  await pyusdContract.write.faucet([patientMintAmount], {
    account: patient.account,
  });

  // Mint PYUSD for escrow reserve (for change/refunds)
  // Need to call faucet multiple times due to 10k limit
  console.log(`Minting PYUSD for escrow reserve (multiple calls)...`);
  const faucetLimit = parseUnits("10000", 6); // 10,000 PYUSD per call
  const numCalls = 3; // 3 x 10k = 30k PYUSD total

  for (let i = 0; i < numCalls; i++) {
    console.log(`  Call ${i + 1}/${numCalls}: Minting ${formatUnits(faucetLimit, 6)} PYUSD...`);
    await pyusdContract.write.faucet([faucetLimit], {
      account: deployer.account,
    });
  }

  console.log("✓ Mock tokens minted successfully\n");
} else {
  console.log("STEP 1: Using Real PYUSD Tokens");
  console.log("-----------------------------------");
  console.log("⚠️  Ensure accounts have sufficient PYUSD balance");
  console.log("   Doctor needs: 1000 PYUSD for stake");
  console.log("   Patient needs: ~100 PYUSD for consultation");
  console.log("   Deployer needs: PYUSD for escrow reserve\n");
}

// Check balances
const doctorBalance = await pyusdContract.read.balanceOf([doctor.account.address]);
const patientBalance = await pyusdContract.read.balanceOf([patient.account.address]);
const deployerBalance = await pyusdContract.read.balanceOf([deployer.account.address]);

console.log("Current PYUSD Balances:");
console.log(`  Doctor: ${formatUnits(doctorBalance as bigint, 6)} PYUSD`);
console.log(`  Patient: ${formatUnits(patientBalance as bigint, 6)} PYUSD`);
console.log(`  Deployer: ${formatUnits(deployerBalance as bigint, 6)} PYUSD`);
console.log("-----------------------------------\n");

// ============================================
// STEP 2: Doctor Registration
// ============================================
console.log("STEP 2: Doctor Registration");
console.log("-----------------------------------");

const stakeAmount = BigInt(deploymentInfo.parameters.doctorStakeAmount);
const depositFee = BigInt(deploymentInfo.parameters.doctorDepositFee);

console.log(`Stake Amount Required: ${formatUnits(stakeAmount, 6)} PYUSD`);
console.log(`Deposit Fee: ${formatUnits(depositFee, 6)} PYUSD`);

// Approve DoctorRegistry to spend PYUSD for stake (for 3 doctors)
const totalStakeForDoctors = stakeAmount * 3n;
console.log(`\nApproving DoctorRegistry to spend ${formatUnits(totalStakeForDoctors, 6)} PYUSD for 3 doctors...`);
await pyusdContract.write.approve(
  [doctorRegistryContract.address, totalStakeForDoctors],
  { account: doctor.account }
);
console.log("✓ Approval granted");

// Doctor 1: Cardiologist
console.log("\n--- Registering Doctor 1: Cardiologist ---");
const doctor1Name = "Sarah Johnson";
const doctor1Specialization = "Cardiologist";
const doctor1Description = "Experienced cardiologist specializing in heart health and preventive care.";
const doctor1Email = "sarah.johnson@example.com";
const doctor1FeePerHour = parseUnits("50", 6); // $50 per hour
const doctor1IPFSHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

console.log(`  Name: ${doctor1Name}`);
console.log(`  Specialization: ${doctor1Specialization}`);
console.log(`  Consultation Fee: ${formatUnits(doctor1FeePerHour, 6)} PYUSD/hour`);

const registerTx1Hash = await doctorRegistryContract.write.registerAsDoctor(
  [doctor1Name, doctor1Specialization, doctor1Description, doctor1Email, doctor1FeePerHour, doctor1IPFSHash],
  { account: doctor.account }
);

await publicClient.waitForTransactionReceipt({ hash: registerTx1Hash });
console.log("✓ Cardiologist registered successfully");
console.log(`  Transaction: ${registerTx1Hash}`);

// Doctor 2: Dermatologist
console.log("\n--- Registering Doctor 2: Dermatologist ---");
const doctor2Name = "Emily Chen";
const doctor2Specialization = "Dermatologist";
const doctor2Description = "Board-certified dermatologist specializing in skin conditions and cosmetic dermatology.";
const doctor2Email = "emily.chen@example.com";
const doctor2FeePerHour = parseUnits("45", 6); // $45 per hour
const doctor2IPFSHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

console.log(`  Name: ${doctor2Name}`);
console.log(`  Specialization: ${doctor2Specialization}`);
console.log(`  Consultation Fee: ${formatUnits(doctor2FeePerHour, 6)} PYUSD/hour`);

const registerTx2Hash = await doctorRegistryContract.write.registerAsDoctor(
  [doctor2Name, doctor2Specialization, doctor2Description, doctor2Email, doctor2FeePerHour, doctor2IPFSHash],
  { account: doctor.account }
);

await publicClient.waitForTransactionReceipt({ hash: registerTx2Hash });
console.log("✓ Dermatologist registered successfully");
console.log(`  Transaction: ${registerTx2Hash}`);

// Doctor 3: Neurologist
console.log("\n--- Registering Doctor 3: Neurologist ---");
const doctor3Name = "Michael Rodriguez";
const doctor3Specialization = "Neurologist";
const doctor3Description = "Expert neurologist focusing on brain and nervous system disorders.";
const doctor3Email = "michael.rodriguez@example.com";
const doctor3FeePerHour = parseUnits("60", 6); // $60 per hour
const doctor3IPFSHash = "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456";

console.log(`  Name: ${doctor3Name}`);
console.log(`  Specialization: ${doctor3Specialization}`);
console.log(`  Consultation Fee: ${formatUnits(doctor3FeePerHour, 6)} PYUSD/hour`);

const registerTx3Hash = await doctorRegistryContract.write.registerAsDoctor(
  [doctor3Name, doctor3Specialization, doctor3Description, doctor3Email, doctor3FeePerHour, doctor3IPFSHash],
  { account: doctor.account }
);

await publicClient.waitForTransactionReceipt({ hash: registerTx3Hash });
console.log("✓ Neurologist registered successfully");
console.log(`  Transaction: ${registerTx3Hash}`);

// Get doctor IDs
const cardiologistId = 1;
const dermatologistId = 2;
const neurologistId = 3;
const doctorId = cardiologistId; // Keep this for backwards compatibility with later code

console.log(`\n✓ All doctors registered successfully`);
console.log(`  Cardiologist ID: ${cardiologistId}`);
console.log(`  Dermatologist ID: ${dermatologistId}`);
console.log(`  Neurologist ID: ${neurologistId}\n`);

// ============================================
// STEP 3: Admin Approves Doctors
// ============================================
console.log("STEP 3: Admin Approves Doctors");
console.log("-----------------------------------");

// Grant APPROVER role to deployer
console.log("Granting APPROVER role to admin...");
const APPROVER_ROLE = await doctorRegistryContract.read.APPROVER();
await doctorRegistryContract.write.grantRole(
  [APPROVER_ROLE, deployer.account.address],
  { account: deployer.account }
);
console.log("✓ APPROVER role granted");

// Approve all three doctors
console.log(`\n--- Approving Cardiologist (ID: ${cardiologistId}) ---`);
const approveTx1Hash = await doctorRegistryContract.write.approveDoctor(
  [cardiologistId],
  { account: deployer.account }
);
await publicClient.waitForTransactionReceipt({ hash: approveTx1Hash });
console.log("✓ Cardiologist approved successfully");
console.log(`  Transaction: ${approveTx1Hash}`);

console.log(`\n--- Approving Dermatologist (ID: ${dermatologistId}) ---`);
const approveTx2Hash = await doctorRegistryContract.write.approveDoctor(
  [dermatologistId],
  { account: deployer.account }
);
await publicClient.waitForTransactionReceipt({ hash: approveTx2Hash });
console.log("✓ Dermatologist approved successfully");
console.log(`  Transaction: ${approveTx2Hash}`);

console.log(`\n--- Approving Neurologist (ID: ${neurologistId}) ---`);
const approveTx3Hash = await doctorRegistryContract.write.approveDoctor(
  [neurologistId],
  { account: deployer.account }
);
await publicClient.waitForTransactionReceipt({ hash: approveTx3Hash });
console.log("✓ Neurologist approved successfully");
console.log(`  Transaction: ${approveTx3Hash}`);

// Verify all doctors are approved
console.log("\n--- Approved Doctors Summary ---");
const approvedDoctor1 = await doctorRegistryContract.read.getDoctor([cardiologistId]);
console.log(`Cardiologist - ${approvedDoctor1.Name}:`);
console.log(`  Specialization: ${approvedDoctor1.specialization}`);
console.log(`  Fee: ${formatUnits(approvedDoctor1.consultationFeePerHour, 6)} PYUSD/hour`);

const approvedDoctor2 = await doctorRegistryContract.read.getDoctor([dermatologistId]);
console.log(`\nDermatologist - ${approvedDoctor2.Name}:`);
console.log(`  Specialization: ${approvedDoctor2.specialization}`);
console.log(`  Fee: ${formatUnits(approvedDoctor2.consultationFeePerHour, 6)} PYUSD/hour`);

const approvedDoctor3 = await doctorRegistryContract.read.getDoctor([neurologistId]);
console.log(`\nNeurologist - ${approvedDoctor3.Name}:`);
console.log(`  Specialization: ${approvedDoctor3.specialization}`);
console.log(`  Fee: ${formatUnits(approvedDoctor3.consultationFeePerHour, 6)} PYUSD/hour`);
console.log("-----------------------------------\n");

// ============================================
// STEP 4: Deposit PYUSD Reserve to Escrow
// ============================================
console.log("STEP 4: Deposit PYUSD Reserve to Escrow");
console.log("-----------------------------------");

const reserveDepositAmount = parseUnits("10000", 6); // 10,000 PYUSD
console.log(`Depositing ${formatUnits(reserveDepositAmount, 6)} PYUSD to escrow reserve...`);

// Approve escrow to spend PYUSD
await pyusdContract.write.approve(
  [consultationEscrowContract.address, reserveDepositAmount],
  { account: deployer.account }
);

// Deposit reserve
const depositReserveTxHash = await consultationEscrowContract.write.depositPyusdReserve(
  [reserveDepositAmount],
  { account: deployer.account }
);
await publicClient.waitForTransactionReceipt({ hash: depositReserveTxHash });

const reserveBalance = await consultationEscrowContract.read.pyUSDReserveBalance();
console.log("✓ Reserve deposited successfully");
console.log(`  Current Reserve: ${formatUnits(reserveBalance, 6)} PYUSD`);
console.log(`  Transaction: ${depositReserveTxHash}`);
console.log("-----------------------------------\n");

// ============================================
// STEP 5: Patient Creates Session with PYUSD Payment
// ============================================
console.log("STEP 5: Patient Creates Consultation Session");
console.log("-----------------------------------");

const consultationPayment = parseUnits("50", 6); // Paying 50 PYUSD
console.log(`Consultation Fee (Cardiologist): ${formatUnits(doctor1FeePerHour, 6)} PYUSD/hour`);
console.log(`Patient Payment: ${formatUnits(consultationPayment, 6)} PYUSD`);

// Approve escrow to spend PYUSD from patient
console.log("\nApproving ConsultationEscrow to spend PYUSD...");
await pyusdContract.write.approve(
  [consultationEscrowContract.address, consultationPayment],
  { account: patient.account }
);
console.log("✓ Approval granted");

// Create session
console.log("\nCreating consultation session...");
console.log(`  Doctor ID: ${doctorId}`);
console.log(`  Payment Token: PYUSD`);
console.log(`  Payment Amount: ${formatUnits(consultationPayment, 6)} PYUSD`);

// For PYUSD payment, we don't need Pyth price data
const emptyPriceData: `0x${string}`[] = [];

const createSessionTxHash = await consultationEscrowContract.write.createSession(
  [
    doctorId,
    consultationPayment,
    emptyPriceData,
    pyusdContract.address,
  ],
  {
    account: patient.account,
    value: 0n, // No ETH needed for PYUSD payment
  }
);

const receipt = await publicClient.waitForTransactionReceipt({ hash: createSessionTxHash });
console.log("✓ Session created successfully");
console.log(`  Transaction: ${createSessionTxHash}`);
console.log(`  Block: ${receipt.blockNumber}`);

// Get session details
const numSessions = await consultationEscrowContract.read.numSessions();
const sessionId = Number(numSessions);

const session = await consultationEscrowContract.read.getSession([BigInt(sessionId)]);
console.log("\nSession Details:");
console.log(`  Session ID: ${sessionId}`);
console.log(`  Doctor ID: ${session.doctorId}`);
console.log(`  Patient: ${session.patient}`);
console.log(`  PYUSD Amount: ${formatUnits(session.pyusdAmount, 6)} PYUSD`);
console.log(`  Status: ${session.status === 0 ? "Active" : "Completed"}`);
console.log(`  Created At: ${new Date(Number(session.createdAt) * 1000).toISOString()}`);

// Get updated reserve balance
const updatedReserveBalance = await consultationEscrowContract.read.pyUSDReserveBalance();
console.log(`\n✓ Escrow Reserve Balance: ${formatUnits(updatedReserveBalance, 6)} PYUSD`);
console.log("-----------------------------------\n");

// ============================================
// Summary
// ============================================
console.log("===========================================");
console.log("DEMO FLOW COMPLETED SUCCESSFULLY!");
console.log("===========================================");
console.log("\nSummary:");
console.log(`  ✓ 3 Doctors registered and approved:`);
console.log(`    - ${doctor1Name} (Cardiologist, ID: ${cardiologistId})`);
console.log(`    - ${doctor2Name} (Dermatologist, ID: ${dermatologistId})`);
console.log(`    - ${doctor3Name} (Neurologist, ID: ${neurologistId})`);
console.log(`  ✓ Session ID: ${sessionId} created with Cardiologist`);
console.log(`  ✓ Patient paid: ${formatUnits(consultationPayment, 6)} PYUSD`);
console.log(`  ✓ Escrow holds: ${formatUnits(session.pyusdAmount, 6)} PYUSD for doctor`);

console.log("\nNext Steps:");
console.log("  1. Doctor provides consultation");
console.log("  2. Doctor uploads prescription to IPFS");
console.log("  3. Doctor calls releasePayment() with IPFS hash");
console.log("  4. Patient can rate the session after completion");

// Final balances
const finalDoctorBalance = await pyusdContract.read.balanceOf([doctor.account.address]);
const finalPatientBalance = await pyusdContract.read.balanceOf([patient.account.address]);
const finalEscrowBalance = await pyusdContract.read.balanceOf([consultationEscrowContract.address]);

console.log("\nFinal PYUSD Balances:");
console.log(`  Doctor: ${formatUnits(finalDoctorBalance as bigint, 6)} PYUSD`);
console.log(`  Patient: ${formatUnits(finalPatientBalance as bigint, 6)} PYUSD`);
console.log(`  Escrow Contract: ${formatUnits(finalEscrowBalance as bigint, 6)} PYUSD`);
console.log("===========================================\n");

console.log("🎉 PulseBridge Demo Complete!");
console.log("\nYour agent should have detected the SessionCreated event!");
console.log("Check the agent logs to verify event detection.\n");
