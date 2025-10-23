import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

const PYUSD_MINT_ADDRESS = new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo');

export class PYUSDPaymentService {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl);
  }

  async createPaymentRequest(appointmentId: string, amount: number, doctorWalletAddress: string) {
    const paymentData = {
      appointmentId,
      amount,
      currency: 'PYUSD' as const,
      status: 'pending_approval' as const,
      approvalRequired: true,
      doctorWalletAddress,
      createdAt: new Date(),
    };
    return paymentData;
  }

  async processApprovedPayment(fromWallet: PublicKey, toWallet: PublicKey, amount: number) {
    const fromTokenAccount = await getAssociatedTokenAddress(PYUSD_MINT_ADDRESS, fromWallet);
    const toTokenAccount = await getAssociatedTokenAddress(PYUSD_MINT_ADDRESS, toWallet);

    const transaction = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromWallet,
        amount * 1e6
      )
    );
    return transaction;
  }
}
