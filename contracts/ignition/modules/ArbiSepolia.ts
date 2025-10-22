import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { pseudoRandomBytes, randomBytes } from "crypto";
const owner = "0xa75f35ed47fC32EFAf2513B1c19194130e41002D"
const depositFee = 1000000; // 1e6 $1
const stakeAmount = 10000000; // 10e6 $10


const ArbiDeploy = buildModule("SepoliaTestnet", (m) => {

// ARBI SEPOLIA..
const PYUSD = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"
const PythOracle = "0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF"
const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"

const USDT = m.contract("MockERC20",["USDT", "USDT"])
const PYTHORACLE = m.contract("PythPriceConsumer",[PythOracle])
const DocRegistry = m.contract("DoctorRegistry",[owner, depositFee, stakeAmount, PYUSD]);
const ConsultationEscrow = m.contract("ConsultationEscrow", [DocRegistry,PythOracle, PYUSD, USDC, USDT])

  return { DocRegistry, ConsultationEscrow };
});


export default ArbiDeploy;
