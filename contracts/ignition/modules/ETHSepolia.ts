import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const owner = "0xa75f35ed47fC32EFAf2513B1c19194130e41002D"
const depositFee = 1000000; // 1e6 $1
const stakeAmount = 10000000; // 10e6 $10

const SepoliaDeploy  = buildModule("VotingModule", (m) => {
// SEPOLIA..
const PYUSD = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"
const PythOracle = "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21"
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"

const USDT = m.contract("MockERC20",["USDT", "USDT"])
const PYTHORACLE = m.contract("PythPriceConsumer",[PythOracle])
const DocRegistry = m.contract("DoctorRegistry",[owner, depositFee, stakeAmount, PYUSD]);
const ConsultationEscrow = m.contract("ConsultationEscrow", [DocRegistry,PythOracle, PYUSD, USDC, USDT])


  return { DocRegistry, ConsultationEscrow };
});

export default {SepoliaDeploy};
