"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Interface untuk data dari API
interface MarketData {
  name: string
  value: number
  changePercent: number
}

// Fungsi untuk fetch data dari API
async function fetchMarketData(type: string): Promise<MarketData[]> {
  try {
    const apiUrl = `http://localhost:5000/api/harga?type=${type}` // Sesuaikan dengan struktur API Anda
    const res = await fetch(apiUrl, { cache: "no-store" })
    if (!res.ok) {
      throw new Error(`Failed to fetch ${type} data: ${res.status} ${res.statusText}`)
    }
    const data = await res.json()
    // Asumsi data dari API dalam format: [{ name: "IHSG", value: 7234.56, changePercent: 1.2 }, ...]
    return data
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error)
    // Fallback data jika API gagal
    switch (type) {
      case "indices":
        return [
          { name: "IHSG", value: 7234.56, changePercent: 1.2 },
          { name: "LQ45", value: 982.45, changePercent: 0.8 },
          { name: "JII", value: 567.23, changePercent: -0.3 },
          { name: "IDX80", value: 234.56, changePercent: 0.5 },
          { name: "IDX30", value: 567.89, changePercent: -0.3 },
          { name: "IDXBUMN20", value: 432.15, changePercent: 1.5 },
          { name: "IDXSMC-LIQ", value: 345.67, changePercent: 0.2 },
          { name: "IDXESGL", value: 287.65, changePercent: -0.7 },
        ]
      case "sectors":
        return [
          { name: "Keuangan", value: 1234.56, changePercent: 2.1 },
          { name: "Konsumer", value: 876.54, changePercent: 0.9 },
          { name: "Properti", value: 432.12, changePercent: -1.2 },
          { name: "Infrastruktur", value: 765.43, changePercent: 1.7 },
          { name: "Pertambangan", value: 543.21, changePercent: -0.8 },
          { name: "Pertanian", value: 321.98, changePercent: 0.4 },
          { name: "Teknologi", value: 876.54, changePercent: 3.2 },
          { name: "Kesehatan", value: 654.32, changePercent: 1.5 },
        ]
      case "commodities":
        return [
          { name: "Minyak Mentah", value: 75.43, changePercent: 2.3 },
          { name: "Emas", value: 1876.54, changePercent: 0.5 },
          { name: "CPO", value: 11450, changePercent: -0.7 },
          { name: "Batubara", value: 98.75, changePercent: 1.2 },
        ]
      case "forex":
        return [
          { name: "USD/IDR", value: 15432, changePercent: -0.3 },
          { name: "EUR/IDR", value: 16789, changePercent: 0.2 },
          { name: "JPY/IDR", value: 107.65, changePercent: -0.5 },
          { name: "SGD/IDR", value: 11432, changePercent: 0.1 },
        ]
      default:
        return []
    }
  }
}

export default function MarketOverview() {
  const [indicesData, setIndicesData] = useState<MarketData[]>([])
  const [sectorsData, setSectorsData] = useState<MarketData[]>([])
  const [commoditiesData, setCommoditiesData] = useState<MarketData[]>([])
  const [forexData, setForexData] = useState<MarketData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data saat komponen dimuat
  useEffect(() => {
    async function loadMarketData() {
      setIsLoading(true)
      const [indices, sectors, commodities, forex] = await Promise.all([
        fetchMarketData("indices"),
        fetchMarketData("sectors"),
        fetchMarketData("commodities"),
        fetchMarketData("forex"),
      ])
      setIndicesData(indices)
      setSectorsData(sectors)
      setCommoditiesData(commodities)
      setForexData(forex)
      setIsLoading(false)
    }
    loadMarketData()
  }, [])

  // Format nilai untuk ditampilkan
  const formatValue = (value: number, type: string) => {
    if (type === "commodities") {
      if (value > 1000)
        return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      return `Rp${value.toLocaleString("id-ID")}`
    }
    if (type === "forex") {
      return value.toLocaleString("id-ID", { minimumFractionDigits: 0 })
    }
    return value.toLocaleString("id-ID", { minimumFractionDigits: 2 })
  }

  const formatChange = (changePercent: number) => {
    return `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%`
  }

  return (
    <Card className="bg-white/80 dark:bg-background/80 backdrop-blur-sm border-secondary/20 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/70"></div>
      <CardHeader>
        <CardTitle>Ringkasan Pasar</CardTitle>
        <CardDescription>Performa indeks utama dan sektor</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading data pasar...</div>
        ) : (
          <Tabs defaultValue="indices">
            <TabsList className="mb-4 bg-secondary/20 dark:bg-muted/20">
              <TabsTrigger value="indices" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Indeks
              </TabsTrigger>
              <TabsTrigger value="sectors" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Sektor
              </TabsTrigger>
              <TabsTrigger
                value="commodities"
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Komoditas
              </TabsTrigger>
              <TabsTrigger value="forex" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Forex
              </TabsTrigger>
            </TabsList>
            <TabsContent value="indices">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {indicesData.map((item) => (
                  <MarketTile
                    key={item.name}
                    name={item.name}
                    value={formatValue(item.value, "indices")}
                    change={formatChange(item.changePercent)}
                    isPositive={item.changePercent >= 0}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="sectors">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sectorsData.map((item) => (
                  <MarketTile
                    key={item.name}
                    name={item.name}
                    value={formatValue(item.value, "sectors")}
                    change={formatChange(item.changePercent)}
                    isPositive={item.changePercent >= 0}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="commodities">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {commoditiesData.map((item) => (
                  <MarketTile
                    key={item.name}
                    name={item.name}
                    value={formatValue(item.value, "commodities")}
                    change={formatChange(item.changePercent)}
                    isPositive={item.changePercent >= 0}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="forex">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {forexData.map((item) => (
                  <MarketTile
                    key={item.name}
                    name={item.name}
                    value={formatValue(item.value, "forex")}
                    change={formatChange(item.changePercent)}
                    isPositive={item.changePercent >= 0}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
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
      <div className="text-lg font-bold mt-1 text-foreground dark:text-foreground">{value}</div>
      <div className={`text-sm mt-1 ${isPositive ? "text-accent dark:text-accent" : "text-red-500 dark:text-red-400"}`}>
        {change}
      </div>
    </div>
  )
}
