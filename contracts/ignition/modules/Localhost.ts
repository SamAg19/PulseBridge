import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { pseudoRandomBytes, randomBytes } from "crypto";
const owner = "0xa75f35ed47fC32EFAf2513B1c19194130e41002D"
const depositFee = 1000000; // 1e6 $1
const stakeAmount = 10000000; // 10e6 $10


const Localhost = buildModule("Localhost", (m) => {


const PYUSD = m.contract("MockERC20",["USDT", "USDT"])
const PythOracle = m.contract("MockPyth");
const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
const USDT = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
const Pyth = m.contract("PythPriceConsumer",[PythOracle])
const DocRegistry = m.contract("DoctorRegistry",[owner, depositFee, stakeAmount, PYUSD]);
const ConsultationEscrow = m.contract("ConsultationEscrow", [DocRegistry,PythOracle, PYUSD, USDC, USDT])




  return { DocRegistry, ConsultationEscrow, PYUSD, PythOracle };
});


export default Localhost;
