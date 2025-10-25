'use client';

import { useState, useEffect } from 'react';
import { HermesClient } from '@pythnetwork/hermes-client';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  confidence: number;
  lastUpdated: Date;
}

interface PythPriceFeedsProps {
  className?: string;
}

export default function PythPriceFeeds({ className = '' }: PythPriceFeedsProps) {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Price IDs for major cryptocurrencies
  const priceIds = [
    {
      id: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH/USD
      symbol: "ETH"
    },
    {
      id: "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b", // USDT/USD
      symbol: "USDT"
    },
    {
      id: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a", // USDC/USD
      symbol: "USDC"
    },
    {
      id: "0xc1da1b73d7f01e7ddd54b3766cf7fcd644395ad14f70aa706ec5384c59e76692", // PyUSD/USD
      symbol: "PyUSD"
    }
  ];

  useEffect(() => {
    fetchPrices();
    
    // Update prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      setError('');
      
      const connection = new HermesClient("https://hermes.pyth.network", {});
      
      // Get latest price updates
      const priceUpdates = await connection.getLatestPriceUpdates(
        priceIds.map(p => p.id)
      );

      if (priceUpdates && priceUpdates.parsed) {
        const priceData: PriceData[] = priceUpdates.parsed.map((update: any, index: number) => {
          const priceInfo = update.price;
          const emaPrice = update.ema_price;
          
          const price = Number(priceInfo.price) * Math.pow(10, priceInfo.expo);
          const emaValue = Number(emaPrice.price) * Math.pow(10, emaPrice.expo);
          
          const change24h = ((price - emaValue) / emaValue) * 100;
          
          const confidence = Number(priceInfo.conf) * Math.pow(10, priceInfo.expo);
          const confidencePercent = (confidence / price) * 100;

          return {
            symbol: priceIds[index].symbol,
            price: price,
            change24h: change24h,
            confidence: confidencePercent,
            lastUpdated: new Date(Number(priceInfo.publish_time) * 1000)
          };
        });

        setPrices(priceData);
        setLastUpdate(new Date());
      }
    } catch (err: any) {
      console.error('Error fetching Pyth prices:', err);
      setError(err.message || 'Failed to fetch price data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, symbol: string) => {
    if (symbol === 'BTC' || symbol === 'ETH') {
      return `${price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    }
    return `${price.toFixed(4)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className={`glass-card rounded-xl p-6 border border-sky-200 bg-sky-50/30 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-sky-800">Live Crypto Prices</h3>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600"></div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sky-200 rounded-full"></div>
                <div className="h-4 bg-sky-200 rounded w-12"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-sky-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-sky-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-card rounded-xl p-6 border border-red-200 bg-red-50 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-800">Price Feed Error</h3>
          <button
            onClick={fetchPrices}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-xl p-6 border border-sky-200 bg-sky-50/30 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-sky-800">Live Crypto Prices</h3>
        <div className="flex items-center space-x-2 text-sm text-sky-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live via Pyth Network</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {prices.map((priceData) => (
          <div key={priceData.symbol} className="flex items-center justify-between p-4 bg-sky-100/50 rounded-lg border border-sky-200 hover:bg-sky-100 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {priceData.symbol}
              </div>
              <div>
                <div className="font-bold text-sky-800 text-lg">{priceData.symbol}/USD</div>
                <div className="text-xs text-sky-600">
                  Confidence: ±{priceData.confidence.toFixed(3)}%
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-lg text-sky-800">
                ${formatPrice(priceData.price, priceData.symbol)}
              </div>
              <div className={`text-sm font-semibold ${
                priceData.change24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(priceData.change24h)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-sky-200">
        <div className="flex items-center justify-between text-xs text-sky-600">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <button
            onClick={fetchPrices}
            className="px-3 py-1 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}