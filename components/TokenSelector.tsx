'use client';

import { Shield, Lock, FileText } from 'lucide-react';

type TokenType = 'PYUSD' | 'ETH' | 'USDC' | 'USDT';

interface TokenSelectorProps {
  selectedToken: TokenType;
  onTokenSelect: (token: TokenType) => void;
  convertedAmount: number;
  consultationFee: number;
  tokenPrices: Array<{ symbol: string; price: number }>;
}

export default function TokenSelector({
  selectedToken,
  onTokenSelect,
  convertedAmount,
  consultationFee,
  tokenPrices
}: TokenSelectorProps) {
  const tokens = [
    { id: 'PYUSD', name: 'PayPal USD', icon: 'PY', color: 'bg-blue-600', description: 'PayPal stablecoin' },
    { id: 'ETH', name: 'Ethereum', icon: 'ETH', color: 'bg-purple-600', description: 'Native token' },
    { id: 'USDC', name: 'USD Coin', icon: 'UC', color: 'bg-indigo-600', description: 'Circle stablecoin' },
    { id: 'USDT', name: 'Tether USD', icon: 'UT', color: 'bg-green-600', description: 'Tether stablecoin' }
  ];

  const getTokenPrice = (tokenId: string) => {
    const price = tokenPrices.find(p => p.symbol === tokenId || (p.symbol === 'PyUSD' && tokenId === 'PYUSD'));
    return price?.price.toFixed(4) || '---';
  };

  const getConvertedAmount = (tokenId: string) => {
    if (consultationFee <= 0 || tokenPrices.length === 0) {
      return '---';
    }

    const pyusdPrice = tokenPrices.find(p => p.symbol === 'PyUSD')?.price || 1;

    if (tokenId === 'PYUSD') {
      return consultationFee.toFixed(2);
    }

    const tokenPrice = tokenPrices.find(p => p.symbol === tokenId)?.price;
    if (!tokenPrice) {
      return '---';
    }

    // Convert: PYUSD fee * PYUSD price / selected token price
    const amountInUSD = consultationFee * pyusdPrice;
    const amountInToken = amountInUSD / tokenPrice;

    return amountInToken.toFixed(6);
  };

  return (
    <div className="space-y-6">
      {/* Token Selection */}
      <div className="glass-card rounded-2xl p-6 border border-blue-200">
        <h2 className="text-xl font-semibold text-primary mb-4">Choose Payment Token</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {tokens.map((token) => (
            <div
              key={token.id}
              onClick={() => onTokenSelect(token.id as TokenType)}
              className={`border rounded-xl p-4 transition-all cursor-pointer ${
                selectedToken === token.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center mb-3">
                <div className={`w-10 h-10 ${token.color} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{token.icon}</span>
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{token.name}</h5>
                  <p className="text-xs text-gray-600">{token.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  {tokenPrices.length > 0 && (
                    <p className="text-xs text-gray-500">
                      ${getTokenPrice(token.id)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {getConvertedAmount(token.id)}
                  </div>
                  <div className="text-xs text-gray-500">{token.id}</div>
                </div>
              </div>
              {selectedToken === token.id && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center justify-center text-sm text-blue-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Selected
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {convertedAmount > 0 && selectedToken !== 'PYUSD' && (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-700 text-center">
              ≈ {consultationFee} PYUSD (converted via Pyth Network)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PaymentSecurityInfo() {
  return (
    <div className="glass-card rounded-2xl p-6 border border-blue-200">
      <h2 className="text-xl font-semibold text-primary mb-4">Security & Protection</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center mb-2">
            <Shield className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">Escrow Protection</span>
          </div>
          <p className="text-sm text-green-700">
            Your payment is held securely until consultation is verified complete
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center mb-2">
            <Lock className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">Smart Contract</span>
          </div>
          <p className="text-sm text-blue-700">
            Automated payment release based on verified consultation completion
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center mb-2">
            <FileText className="w-5 h-5 text-purple-600 mr-2" />
            <span className="font-medium text-purple-800">Blockchain Audit</span>
          </div>
          <p className="text-sm text-purple-700">
            Complete transaction history recorded immutably on blockchain
          </p>
        </div>
      </div>
    </div>
  );
}
