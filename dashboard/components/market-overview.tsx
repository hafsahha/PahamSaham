"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Interface untuk data dari API
interface MarketData {
  name: string
  value: number
  changePercent: number
  source?: string // Untuk menandai sumber data (opsional)
}

interface IndexHistory {
  Date: string
  Open: number
  High: number
  Low: number
  Close: number
  Volume: number
  Dividends?: number
  "Stock Splits"?: number
}

interface IndexData {
  symbol: string
  info: {
    shortName?: string
    longName?: string
  }
  history: IndexHistory[]
}

// Fungsi untuk fetch data dari API

const SECTOR_CACHE_KEY = 'market-sectors-cache';

// Fungsi untuk mendapatkan data dari cache
function getSectorCachedData(): {data: MarketData[], timestamp: number} | null {
  const cachedData = localStorage.getItem(SECTOR_CACHE_KEY);
  if (!cachedData) return null;
  return JSON.parse(cachedData);
}

// Fungsi untuk menyimpan data ke cache
function setSectorCachedData(data: MarketData[]) {
  const dataToCache = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(SECTOR_CACHE_KEY, JSON.stringify(dataToCache));
}

// Fungsi untuk fetch data dari API (modifikasi)
async function fetchMarketData(type: string): Promise<MarketData[]> {
  try {
    const apiUrl = `http://localhost:5000/api/market-overview?type=${type}`;
    const res = await fetch(apiUrl, { cache: 'no-store' });
    
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`Data ${type} tidak tersedia`);
        return [];
      } else {
        throw new Error(`Failed to fetch ${type} data: ${res.status} ${res.statusText}`);
      }
    }
    
    let data = await res.json();
    
    if (data && data.status === 'error') {
      console.warn(`API Error: ${data.message || 'Unknown error'}`);
      return [];
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn(`Tidak ada data ${type} tersedia`);
      return [];
    }
    
    // Tambahkan timestamp ke data
    return data.map((item: MarketData) => ({
      ...item,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return [];
  }
}

// Fallback data untuk sektor saham Indonesia
const sectorFallbackData: MarketData[] = [
  { name: "Keuangan", value: 1642.58, changePercent: 0.87 },
  { name: "Konsumer", value: 850.25, changePercent: -0.43 },
  { name: "Properti", value: 485.62, changePercent: 0.52 },
  { name: "Infrastruktur", value: 1230.78, changePercent: 1.24 },
  { name: "Pertambangan", value: 2450.32, changePercent: -1.85 },
  { name: "Pertanian", value: 1120.48, changePercent: 0.64 },
  { name: "Teknologi", value: 986.24, changePercent: 2.31 },
  { name: "Kesehatan", value: 775.91, changePercent: 0.38 }
];

// Fallback data untuk komoditas relevan dengan Indonesia
const commoditiesFallbackData: MarketData[] = [
  { name: "Minyak (Brent)", value: 78.45, changePercent: -0.65 },
  { name: "Batubara", value: 148.32, changePercent: 1.24 },
  { name: "CPO", value: 3785.50, changePercent: -0.82 },
  { name: "Emas", value: 2305.60, changePercent: 0.45 }
];

// Fallback data untuk forex yang relevan dengan Indonesia
const forexFallbackData: MarketData[] = [
  { name: "USD/IDR", value: 15750, changePercent: -0.25 },
  { name: "EUR/IDR", value: 17250, changePercent: 0.15 },
  { name: "JPY/IDR", value: 109.80, changePercent: -0.35 },
  { name: "SGD/IDR", value: 11850, changePercent: 0.20 }
];


export default function MarketOverview() {
  const [sectorsData, setSectorsData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessages, setErrorMessages] = useState<{[key: string]: string}>({});
  const [useFallbackData, setUseFallbackData] = useState<{[key: string]: boolean}>({});

  // Fetch data saat komponen dimuat
  useEffect(() => {
    async function loadMarketData() {
      setIsLoading(true);
      const errors: {[key: string]: string} = {};
      const fallbacks: {[key: string]: boolean} = {};
      
      // Cek cache terlebih dahulu
      const cachedData = getSectorCachedData();
      const cacheExpiry = 5 * 60 * 1000; // 5 menit dalam milidetik
      
      if (cachedData && (Date.now() - cachedData.timestamp) < cacheExpiry) {
        // Gunakan data cache jika masih valid
        setSectorsData(cachedData.data);
        setIsLoading(false);
        return;
      }
      
      async function fetchSectorData() {
        try {
          const data = await fetchMarketData("sectors");
          if (data.length > 0) {
            // Simpan ke cache
            setSectorCachedData(data);
            return data;
          } else {
            console.warn(`Data sektor kosong, menggunakan data fallback`);
            fallbacks["sectors"] = true;
            return sectorFallbackData;
          }
        } catch (err) {
          console.error(`Error loading sektor data:`, err);
          errors["sectors"] = err instanceof Error ? err.message : `Gagal memuat data sektor`;
          fallbacks["sectors"] = true;
          return sectorFallbackData;
        }
      }
      
      const sectors = await fetchSectorData();
      
      setSectorsData(sectors);
      setErrorMessages(errors);
      setUseFallbackData(fallbacks);
      setIsLoading(false);
    }
    
    loadMarketData();
    
    // Refresh data setiap 5 menit
    const intervalId = setInterval(loadMarketData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  
  // Format nilai untuk ditampilkan sesuai dengan konteks saham Indonesia
  const formatValue = (value: number, type: string) => {
    if (type === "commodities") {
      // Komoditas berbeda format berdasarkan jenisnya
      if (value > 1000) {
        // Batubara biasanya dalam USD
        return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      } else if (value > 100) {
        // CPO dalam Rupiah
        return `Rp${value.toLocaleString("id-ID")}`
      } else {
        // Minyak biasanya dalam USD
        return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      }
    }
    else if (type === "forex") {
      // Forex dalam format IDR (tanpa koma desimal)
      return `Rp${value.toLocaleString("id-ID", { minimumFractionDigits: 0 })}`
    }
    else if (type === "indices") {
      // Untuk indeks saham Indonesia (IHSG, LQ45, dll)
      return value.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    } 
    else if (type === "sectors") {
      // Sektor saham di BEI
      return value.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    }
    
    // Default format
    return value.toLocaleString("id-ID", { minimumFractionDigits: 2 })
  }

  const formatChange = (changePercent: number) => {
    return `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`
  }
  return (
    <Card className="bg-white/80 dark:bg-background/80 backdrop-blur-sm border-secondary/20 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/70"></div>
      <CardHeader>
        <CardTitle>Ringkasan Sektor</CardTitle>
        <CardDescription>Performa sektor-sektor di Bursa Efek Indonesia</CardDescription>
      </CardHeader>      
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading data sektor...</div>
        ) : (          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{sectorsData.map((item) => (
                <MarketTile
                  key={item.name}
                  name={item.name}
                  value={formatValue(item.value, "sectors")}
                  change={formatChange(item.changePercent)}
                  isPositive={item.changePercent >= 0}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface MarketTileProps {
  name: string
  value: string
  change: string
  isPositive: boolean
}

function MarketTile({ name, value, change, isPositive }: MarketTileProps) {
  return (
    <div className="bg-white dark:bg-card rounded-lg p-3 shadow-sm border border-secondary/10 dark:border-border relative overflow-hidden group hover:border-primary/20 transition-colors">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="text-sm font-medium text-primary dark:text-primary">{name}</div>
      
      {/* Tampilkan pesan "Data tidak tersedia" jika tidak ada nilai */}
      {value ? (
        <>
          <div className="text-lg font-bold mt-1 text-foreground dark:text-foreground">{value}</div>
          <div className={`text-sm mt-1 ${isPositive ? "text-accent dark:text-accent" : "text-red-500 dark:text-red-400"}`}>
            {change}
          </div>
        </>
      ) : (
        <div className="text-sm mt-1 text-yellow-600 dark:text-yellow-400">Data tidak tersedia</div>
      )}
    </div>
  )
}
