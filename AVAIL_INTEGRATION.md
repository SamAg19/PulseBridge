# Avail Nexus Integration - PulseBridge

## 🎯 Why Avail Nexus?

**Problem Solved:** Patients have funds scattered across multiple blockchains (Ethereum, Polygon, Arbitrum, etc.), but our healthcare platform operates on Sepolia. Traditional bridges are complex and require multiple steps.

**Avail Solution:** Unified balance management and one-click cross-chain transfers without liquidity concerns, making healthcare payments truly borderless.

## 🔗 Code References

| Component | Purpose | GitHub Link |
|-----------|---------|-------------|
| Nexus SDK | SDK initialization & balance management | [app/lib/nexus.ts](https://github.com/SamAg19/PulseBridge/blob/main/app/lib/nexus.ts) |
| Bridge Widget | Bridge widget component | [NexusBridgePayment.tsx](https://github.com/SamAg19/PulseBridge/blob/main/components/payment/NexusBridgePayment.tsx) |
| Bridge & Execute | Combined bridge & payment execution | [NexusBridgeAndExecutePayment.tsx](https://github.com/SamAg19/PulseBridge/blob/main/components/payment/NexusBridgeAndExecutePayment.tsx) |
| Payment Flow | Payment flow integration | [patient/payments/page.tsx](https://github.com/SamAg19/PulseBridge/blob/main/app/patient/payments/page.tsx) |
| Dependencies | Avail Nexus SDK packages | [package.json](https://github.com/SamAg19/PulseBridge/blob/main/package.json) |
| Feedback | Integration feedback & notes | [AVAIL_FEEDBACK.md](https://github.com/SamAg19/PulseBridge/blob/main/AVAIL_FEEDBACK.md) |
