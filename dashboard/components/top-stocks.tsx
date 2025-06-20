"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Interface untuk data dari API
interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  timestamp?: number // Tambahkan timestamp untuk cache
}

// Cache key
const CACHE_KEY = 'top-stocks-cache'

// Fungsi untuk mendapatkan data dari cache
function getCachedData(): {gainers: StockData[], losers: StockData[], timestamp: number} | null {
  const cachedData = localStorage.getItem(CACHE_KEY)
  if (!cachedData) return null
  return JSON.parse(cachedData)
}

// Fungsi untuk menyimpan data ke cache
function setCachedData(gainers: StockData[], losers: StockData[]) {
  const dataToCache = {
    gainers,
    losers,
    timestamp: Date.now()
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache))
}

// Fungsi untuk fetch data dari API
async function fetchTopStocks(filter: string): Promise<StockData[]> {
  try {
    const apiUrl = `http://20.189.76.140:5000/api/top-stocks?filter=${filter}&limit=5`
    const res = await fetch(apiUrl, { cache: "no-store" })
    if (!res.ok) {
      throw new Error(`Failed to fetch top ${filter}: ${res.status} ${res.statusText}`)
    }
    const data = await res.json()
    
    if (data.status === 'error') {
      throw new Error(`API Error: ${data.message || 'Unknown error'}`)
    }
    
    // Tambahkan timestamp ke setiap data
    return data.map((item: StockData) => ({
      ...item,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error(`Error fetching top ${filter}:`, error)
    return []
  }
}

export default function TopStocks() {
  const [gainers, setGainers] = useState<StockData[]>([])
  const [losers, setLosers] = useState<StockData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data saat komponen dimuat
  useEffect(() => {
    async function loadTopStocks() {
      setIsLoading(true)
      
      // Cek cache terlebih dahulu
      const cachedData = getCachedData()
      const cacheExpiry = 5 * 60 * 1000 // 5 menit dalam milidetik
      
      if (cachedData && (Date.now() - cachedData.timestamp) < cacheExpiry) {
        // Gunakan data cache jika masih valid
        setGainers(cachedData.gainers)
        setLosers(cachedData.losers)
        setIsLoading(false)
        return
      }
      
      // Jika cache tidak ada atau sudah expired, fetch dari API
      const [gainsData, lossesData] = await Promise.all([
        fetchTopStocks("gainers"),
        fetchTopStocks("losers")
      ])
      
      setGainers(gainsData)
      setLosers(lossesData)
      setCachedData(gainsData, lossesData)
      setIsLoading(false)
    }
    
    loadTopStocks()
    
    // Refresh data setiap 1 menit
    const intervalId = setInterval(loadTopStocks, 60 * 1000)
    return () => clearInterval(intervalId)
  }, [])

  // Format nilai untuk ditampilkan
  const formatPrice = (value: number) => {
    return value.toLocaleString("id-ID")
  }

  const formatChange = (change: number, percent: number) => {
    return `${change >= 0 ? "+" : ""}${change.toFixed(0)} (${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%)`
  }

  return (
    <Card className="bg-white/80 dark:bg-background/80 backdrop-blur-sm border-secondary/20 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-green-400"></div>
      <CardHeader>
        <CardTitle>Top Movers</CardTitle>
        <CardDescription>Saham dengan pergerakan harga tertinggi</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading data saham...</div>
        ) : (
          <Tabs defaultValue="gainers">
            <TabsList className="mb-4 bg-secondary/20 dark:bg-muted/20">
              <TabsTrigger value="gainers" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Top Gainers
              </TabsTrigger>
              <TabsTrigger value="losers" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                Top Losers
              </TabsTrigger>
            </TabsList>            <TabsContent value="gainers">
              <div className="space-y-2">
                {gainers.length > 0 ? (
                  gainers.map((stock) => (
                    <StockTile
                      key={stock.symbol}
                      symbol={stock.symbol}
                      name={stock.name}
                      price={formatPrice(stock.price)}
                      change={formatChange(stock.change, stock.changePercent)}
                      isPositive={true}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center border rounded-lg bg-secondary/10">
                    <p className="text-muted-foreground">Data tidak tersedia</p>
                  </div>
                )}
              </div>
            </TabsContent>            <TabsContent value="losers">
              <div className="space-y-2">
                {losers.length > 0 ? (
                  losers.map((stock) => (
                    <StockTile
                      key={stock.symbol}
                      symbol={stock.symbol}
                      name={stock.name}
                      price={formatPrice(stock.price)}
                      change={formatChange(stock.change, stock.changePercent)}
                      isPositive={false}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center border rounded-lg bg-secondary/10">
                    <p className="text-muted-foreground">Data tidak tersedia</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

interface StockTileProps {
  symbol: string
  name: string
  price: string
  change: string
  isPositive: boolean
}

function StockTile({ symbol, name, price, change, isPositive }: StockTileProps) {
  return (
    <div className="bg-white dark:bg-card rounded-md p-3 shadow-sm border border-secondary/10 dark:border-border flex justify-between items-center hover:border-primary/20 transition-colors">
      <div>
        <div className="text-sm font-medium text-primary dark:text-primary">{symbol}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{name}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-foreground dark:text-foreground">{price}</div>
        <div className={`text-xs ${isPositive ? "text-green-600 dark:text-green-500" : "text-red-500 dark:text-red-400"}`}>
          {change}
        </div>
      </div>
    </div>
  )
}
