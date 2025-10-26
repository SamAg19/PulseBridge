# PayPal USD (PYUSD) Integration - PulseBridge


## 🎯 Why PYUSD?

**Problem Solved:** Healthcare payments need stability, trust, and accessibility. Volatile cryptocurrencies create pricing uncertainty, while traditional payment methods lack blockchain benefits.

**PYUSD Solution:** A regulated, USD-backed stablecoin that combines the stability of fiat with the efficiency of blockchain, making it perfect for healthcare payments.

## 🔗 Code References

### Core Files
| Component | Purpose | GitHub Link |
|-----------|---------|-------------|
| Contract Addresses | PYUSD contract addresses | [lib/constants.ts](https://github.com/SamAg19/PulseBridge/blob/main/lib/constants.ts) |
| Contract Hooks | PYUSD balance, approval, registration | [lib/contracts/hooks.ts](https://github.com/SamAg19/PulseBridge/blob/main/lib/contracts/hooks.ts) |
| Contract Utils | Session data with PYUSD amounts | [lib/contracts/utils.ts](https://github.com/SamAg19/PulseBridge/blob/main/lib/contracts/utils.ts) |
| Payment Flow | Payment flow with PYUSD | [app/patient/payments/page.tsx](https://github.com/SamAg19/PulseBridge/blob/main/app/patient/payments/page.tsx) |
| Payment History | PYUSD transaction history | [app/patient/payment-history/page.tsx](https://github.com/SamAg19/PulseBridge/blob/main/app/patient/payment-history/page.tsx) |
| Payment Section | PYUSD token selection | [components/booking/PaymentSection.tsx](https://github.com/SamAg19/PulseBridge/blob/main/components/booking/PaymentSection.tsx) |
| Token Selector | PYUSD conversion display | [components/TokenSelector.tsx](https://github.com/SamAg19/PulseBridge/blob/main/components/TokenSelector.tsx) |

### Smart Contracts
| Contract | Purpose | GitHub Link |
|----------|---------|-------------|
| DoctorRegistry | Doctor profiles with PYUSD fees | [DoctorRegistry.sol](https://github.com/SamAg19/PulseBridge/blob/main/contracts/contracts/DoctorRegistry/DoctorRegistry.sol) |
| ConsultationEscrow | Payment escrow in PYUSD | [ConsultationEscrow.sol](https://github.com/SamAg19/PulseBridge/blob/main/contracts/contracts/ConsultationEscrow/ConsultationEscrow.sol) |
| PythPriceConsumer | ETH/USDC/USDT → PYUSD conversion | [PythPriceConsumer.sol](https://github.com/SamAg19/PulseBridge/blob/main/contracts/contracts/Oracle/PythPriceConsumer.sol) |
| Deposit Script | PYUSD reserve management | [deposit-pyusd-reserve.ts](https://github.com/SamAg19/PulseBridge/blob/main/contracts/scripts/deposit-pyusd-reserve.ts) |

---


