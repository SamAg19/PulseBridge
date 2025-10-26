# Avail Nexus SDK - Developer Feedback & Documentation Review

## Overview
This document provides comprehensive feedback on the Avail Nexus SDK (`@avail-project/nexus-core` and `@avail-project/nexus-widgets`) based on real-world implementation experience in a healthcare payment application. The feedback covers documentation quality, developer experience, and areas for improvement.

---

## What Worked Well

### 1. Core SDK Functionality
The Nexus SDK delivered on its core promise of unified balance management across chains. The implementation was straightforward:

```typescript
import { NexusSDK } from '@avail-project/nexus-core';

export const sdk = new NexusSDK({ network: 'testnet' });

export async function getUnifiedBalances() {
  return await sdk.getUnifiedBalances();
}
```

The SDK's initialization pattern with EIP-1193 providers (MetaMask, etc.) worked seamlessly once properly configured.

### 2. Widget Integration
The `@avail-project/nexus-widgets` package provided ready-to-use React components that significantly reduced development time. The `BridgeButton` component with prefill options was particularly useful:

```typescript
<BridgeButton
  prefill={{
    chainId: chainId,
    token: selectedToken,
    amount: convertedAmount,
  }}
>
  {({ onClick, isLoading }) => (
    <button onClick={onClick} disabled={isLoading}>
      Bridge Tokens
    </button>
  )}
</BridgeButton>
```

### 3. TypeScript Support
Both packages include TypeScript definitions, making development more predictable and reducing runtime errors.

---

## Critical Issues Encountered

### 1. Next.js Turbopack Compatibility Issue
**Problem:** The documentation's starter kit README recommended using Turbopack (`next dev --turbo`), which caused build failures with the Nexus SDK.

**Error Encountered:**

![Turbopack error with Nexus SDK](./images/image-2.png)

```
Module not found: Can't resolve '@avail-project/nexus-core'
```

**Solution:** Explicitly disable Turbopack in package.json scripts:

![Working solution - disable Turbopack](./images/image-6.png)

```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack"
  }
}
```

**Recommendation:** The documentation should prominently warn developers about this incompatibility or provide a Turbopack-compatible version. This should be mentioned in the "Getting Started" section, not buried in troubleshooting.

### 2. Version Mismatch Between Packages
**Issue:** The `nexus-widgets` package (v0.0.5) internally depends on `nexus-core` v0.0.1, while the latest standalone version is v0.0.2. This creates dependency conflicts and potential runtime issues.

**Impact:** Developers may experience unexpected behavior when using both packages together.

**Recommendation:** Ensure version alignment across packages or clearly document which versions are compatible.

---

## Documentation Issues

### 1. Inconsistent Import Path Examples
**Problem:** The documentation shows different import path styles without explaining when to use each:

- Some examples use: `@/lib/nexus` (TypeScript path alias)
- Others use: `../lib/nexus` (relative path)

![Inconsistent import paths in documentation](./images/image-4.png)

![More import path inconsistencies](./images/image-5.png)

**Impact:** Confusing for developers, especially those new to Next.js or TypeScript path mapping.

**Recommendation:** 
- Standardize on one approach (preferably path aliases with `@/`)
- Include a setup section explaining tsconfig.json path configuration
- Add a note: "This guide uses TypeScript path aliases. If you haven't configured them, use relative paths instead."


### 2. Text Readability Issues
**Problem:** Code snippets and some text sections appear in small font sizes, making them difficult to read.

![Text readability issue - small font sizes](./images/image.png)

**Recommendation:**
- Increase base font size for code blocks
- Ensure proper contrast ratios for accessibility
- Test documentation on various screen sizes

### 3. Copy-Paste Functionality Bug
**Problem:** When clicking "Copy" on code examples, the clipboard receives incorrect content instead of the actual code.

![Copy button bug - wrong content copied](./images/image-1.png)

When clicking the copy button, this is what gets copied to clipboard:
```
---
image: '/img/docs-link-preview.png'
---
```

**Impact:** Developers waste time debugging code that was never meant to be copied.

**Recommendation:** Fix the copy button JavaScript to target the correct DOM element containing the actual code.

---

## Developer Experience Improvements

### 1. Provider Setup Guide
The documentation lacks a comprehensive guide on setting up the NexusProvider with other common providers (Wagmi, RainbowKit, etc.). Developers need to figure out the correct provider hierarchy:

```typescript
// This pattern should be documented
<WagmiProvider config={config}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider>
      <NexusProvider config={{ network: 'testnet' }}>
        {children}
      </NexusProvider>
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

### 2. Add Troubleshooting Section
Include common issues and solutions:
- "SDK not initializing" → Check provider connection
- "Transaction stuck" → Network congestion guidance
- "Balance not updating" → Refresh patterns

---

## Specific Code Examples Needed

### 1. Initialization Patterns
```typescript
// Document this pattern clearly
const [isInitialized, setIsInitialized] = useState(false);

useEffect(() => {
  const init = async () => {
    if (window.ethereum && !sdk.isInitialized()) {
      await sdk.initialize(window.ethereum);
      setIsInitialized(true);
    }
  };
  init();
}, []);
```

### 2. Balance Monitoring
```typescript
// Show how to poll or subscribe to balance changes
const [balances, setBalances] = useState(null);

useEffect(() => {
  const fetchBalances = async () => {
    const unified = await sdk.getUnifiedBalances();
    setBalances(unified);
  };
  
  fetchBalances();
  const interval = setInterval(fetchBalances, 10000);
  return () => clearInterval(interval);
}, []);
```

### 3. Transaction Status Tracking
Document how to track bridge transaction status from initiation to completion.

---


## Conclusion

The Avail Nexus SDK provides solid functionality for cross-chain operations, and the widget library accelerates development significantly. However, the documentation needs refinement to match the quality of the underlying technology. 

The most critical issue was Turbopack incompatibility—cost several hours of debugging and should be addressed immediately. Once documentation gaps are filled and consistency issues resolved, Nexus will provide an excellent developer experience.

The core technology is promising, and with improved documentation, it has the potential to become a go-to solution for cross-chain balance management and bridging operations.

---

