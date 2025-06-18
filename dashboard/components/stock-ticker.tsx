"use client"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

// Define interfaces for ticker data
interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
}

export default function StockTicker() {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [duplicated, setDuplicated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Fungsi untuk mengambil daftar emiten
    const fetchAllEmiten = async () => {
      try {
        // Ambil semua emiten dari API /api/emiten
        const emitenResponse = await fetch("http://20.189.76.140:5000/api/emiten");
        if (!emitenResponse.ok) {
          throw new Error("Failed to fetch emitens");
        }
        const allEmitenList = await emitenResponse.json();
        
        // Ambil hanya 10 emiten pertama
        const emitenList = allEmitenList.slice(0, 10);
        console.log("Fetching data for 10 emitens:", emitenList);

        // Ambil harga saham untuk 10 emiten
        const pricePromises = emitenList.map(async (emiten: string) => {
          const priceResponse = await fetch(`http://20.189.76.140:5000/api/harga?emiten=${emiten}&period=daily`);
          if (!priceResponse.ok) {
            throw new Error(`Failed to fetch price for ${emiten}`);
          }
          const priceData = await priceResponse.json();

          // Ambil data harga saham untuk emiten dan hitung perubahan harga
          const latestPrice = priceData[priceData.length - 1]; // Ambil harga terakhir
          return {
            symbol: latestPrice.Symbol,
            price: latestPrice.Close.toFixed(2),  // Harga penutupan
            change: `${((latestPrice.Close - latestPrice.Open) / latestPrice.Open * 100).toFixed(2)}%`,
            isPositive: latestPrice.Close > latestPrice.Open
          };
        });

        // Menunggu semua data harga saham selesai
        const allPriceData = await Promise.all(pricePromises);        // Set data ticker dengan data harga yang sudah lengkap
        setTickerItems(allPriceData);
        setDuplicated(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching ticker data:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAllEmiten();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="hidden md:block flex-1 overflow-hidden bg-white/50 dark:bg-background/50 backdrop-blur-sm border-x border-secondary/20">
      <div className="ticker-wrap">        <div className="ticker">
          {tickerItems.map((item: TickerItem, index: number) => (
            <div key={index} className="ticker-item">
              <span className="font-medium text-primary">{item.symbol}</span>
              <span className="mx-1">Rp{item.price}</span>
              <span className={`flex items-center ${item.isPositive ? "text-accent" : "text-red-500"}`}>
                {item.isPositive ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                {item.change}
              </span>
            </div>
          ))}
          {duplicated &&
            tickerItems.map((item: TickerItem, index: number) => (
              <div key={`dup-${index}`} className="ticker-item">
                <span className="font-medium text-primary">{item.symbol}</span>
                <span className="mx-1">Rp{item.price}</span>
                <span className={`flex items-center ${item.isPositive ? "text-accent" : "text-red-500"}`}>
                  {item.isPositive ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                  {item.change}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
