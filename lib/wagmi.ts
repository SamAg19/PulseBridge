import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, arbitrumSepolia, hardhat} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Healthcare Platform',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c4f79cc821944d9680842e34466bfbd', // Temporary fallback
  chains: [sepolia],
  ssr: true,
});