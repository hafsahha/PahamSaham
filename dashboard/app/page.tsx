"use client"

import { useState, useEffect } from "react"
import {
  ArrowDown,
  ArrowUp,
  Bell,
  ChevronDown,
  Clock,
  Menu,
  Plus,
  Search,
  Settings,
  Star,
  TrendingUp,
  BarChart3,
  Newspaper,
  Briefcase,
  Globe,
  LineChart,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

import StockChart from "@/components/stock-chart"
import MarketOverview from "@/components/market-overview"
import StockNews from "@/components/stock-news"
import StockTicker from "@/components/stock-ticker"
import StockComparison from "@/components/stock-comparison"
import PortfolioAnalytics from "@/components/portfolio-analytics"
import TopStocks from "@/components/top-stocks"
import { ThemeToggle } from "@/components/theme-toggle"
import { StockFinancials } from "@/components/stock-finance"
import { FinancialChartCard } from "@/components/financial-chart"

// Interface untuk tipe data dari API
interface Emiten {
  ticker: string
  name: string
}

interface PriceData {
  Close: number
  Date: string
  High: number
  Low: number
  Open: number
  Symbol: string
  Volume: number
}

interface StockData {
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
}

interface FinancialData {
  Cash: number | null
  CashFromFinancing: string
  CashFromInvesting: string
  CashFromOperating: string
  CurrencyType: string
  EndDate: string
  EntityCode: string
  EntityName: string
  GrossProfit: number | null
  LongTermBorrowing: number | null
  NetProfit: string
  OperatingProfit: string
  Revenue: number | null
  ShortTermBorrowing: number | null
  TotalAssets: string
  TotalEquity: string
  filename: string
}

// Fungsi untuk fetch data emiten
async function fetchEmiten(): Promise<Emiten[]> {
  try {
    const apiUrl = "http://localhost:5000/api/emiten"
    const res = await fetch(apiUrl, { cache: "no-store" })
    if (!res.ok) {
      throw new Error(`Failed to fetch emiten: ${res.status} ${res.statusText}`)
    }
    const tickers: string[] = await res.json()
    console.log("Fetched emitens:", tickers)
    return tickers.map((ticker) => ({ ticker, name: ticker.split(".")[0] }))
  } catch (error) {
    console.error("Error fetching emitens:", error)
    return [{ ticker: "BBRI.JK", name: "BBRI" }]
  }
}

// Fungsi untuk fetch data harga
async function fetchPriceData(emiten: string, period: string): Promise<PriceData[]> {
  try {
    const apiUrl = `http://localhost:5000/api/harga?emiten=${emiten}&period=${period}`
    const res = await fetch(apiUrl, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to fetch price data")
    return await res.json()
  } catch (error) {
    console.error(error)
    return []
  }
}

async function fetchFinancialData(entityCode: string): Promise<FinancialData[]> {
  try {
    const apiUrl = `http://localhost:5000/api/idx/finance?entity_code=${entityCode}`
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error("Failed to fetch financial data")
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data as FinancialData[]
  } catch (error) {
    console.error("Error fetching financial data:", error)
    return []
  }
}

// Komponen Skeleton untuk loading
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-secondary/30 rounded ${className}`} />
  )
}

// Komponen untuk baris tabel saham
function StockRow({ emiten }: { emiten: Emiten }) {
  const [stockPriceData, setStockPriceData] = useState<StockData | null>(null)

  useEffect(() => {
    async function loadStockPrice() {
      const data = await fetchPriceData(emiten.ticker, "yearly")
      setStockPriceData(calculateStockData(data))
    }
    loadStockPrice()
  }, [emiten.ticker])

  const formatCurrency = (value: number) => `Rp${value.toLocaleString("id-ID")}`
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  const formatVolume = (value: number) => `${(value / 1000000).toFixed(1)}M`

  return (
    <TableRow className="hover:bg-secondary/5">
      <TableCell className="font-medium">{emiten.ticker}</TableCell>
      <TableCell>{emiten.name}</TableCell>
      <TableCell className="text-right">
        {stockPriceData ? formatCurrency(stockPriceData.price) : <Skeleton className="h-4 w-16 ml-auto" />}
      </TableCell>
      <TableCell
        className={`text-right ${stockPriceData && stockPriceData.change >= 0 ? "text-accent" : "text-red-500"}`}
      >
        {stockPriceData ? (
          (stockPriceData.change >= 0 ? "+" : "-") + formatCurrency(Math.abs(stockPriceData.change))
        ) : (
          <Skeleton className="h-4 w-16 ml-auto" />
        )}
      </TableCell>
      <TableCell
        className={`text-right ${stockPriceData && stockPriceData.changePercent >= 0 ? "text-accent" : "text-red-500"}`}
      >
        {stockPriceData ? (
          (stockPriceData.changePercent >= 0 ? "+" : "-") + formatPercentage(Math.abs(stockPriceData.changePercent))
        ) : (
          <Skeleton className="h-4 w-16 ml-auto" />
        )}
      </TableCell>
      <TableCell className="text-right">
        {stockPriceData ? formatVolume(stockPriceData.volume) : <Skeleton className="h-4 w-16 ml-auto" />}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent">
          <Plus className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

// Hitung data saham (price, change, dll.) dari data harga
function calculateStockData(prices: PriceData[]): StockData | null {
  if (prices.length < 1) return null
  const latest = prices[prices.length - 1]
  const previous = prices.length > 1 ? prices[prices.length - 2] : null

  const price = latest.Close
  const change = previous ? price - previous.Close : 0
  const changePercent = previous ? (change / previous.Close) * 100 : 0

  return {
    price,
    change,
    changePercent,
    open: latest.Open,
    high: latest.High,
    low: latest.Low,
    volume: latest.Volume,
  }
}

// Komponen Client
export default function Dashboard() {
  const [initialEmiten, setInitialEmiten] = useState<Emiten[]>([])
  const [activeStock, setActiveStock] = useState("BBRI.JK")
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [financialData, setFinancialData] = useState<FinancialData[]>([])
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("yearly")

  // Fetch daftar emiten saat komponen dimuat
  useEffect(() => {
    async function loadInitialEmiten() {
      setIsLoading(true)
      const emitens = await fetchEmiten()
      setInitialEmiten(emitens)
      setActiveStock(emitens[0]?.ticker || "BBRI.JK")
      setIsLoading(false)
    }
    loadInitialEmiten()
  }, [])

  // Fetch data harga saat activeStock atau period berubah
  useEffect(() => {
    async function loadPriceData() {
      if (!activeStock) return
      setIsLoading(true)
      const data = await fetchPriceData(activeStock, period)
      setPriceData(data)
      setStockData(calculateStockData(data))
      setIsLoading(false)
    }
    loadPriceData()
  }, [activeStock, period])

  useEffect(() => {
    async function loadFinancialData() {
      if (!activeStock) return
      const entityCode = activeStock.split('.')[0]
      const data = await fetchFinancialData(entityCode)
      setFinancialData(data || [])
    }
    loadFinancialData()
  }, [activeStock])

  // Filter emiten berdasarkan pencarian
  const filteredEmiten = initialEmiten.filter(
    (emiten) =>
      emiten.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emiten.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatCurrency = (value: number) => `Rp${value.toLocaleString("id-ID")}`
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`
  const formatVolume = (value: number) => `${(value / 1000000).toFixed(1)}M`

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-secondary/50 to-secondary">
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-6 shadow-sm">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5">
              <LineChart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              pahamsaham
            </span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
        </header>
        <div className="flex flex-1">
          <aside className="hidden md:block border-r bg-white/80 dark:bg-background/95 backdrop-blur-sm fixed top-16 left-0 w-[240px] h-[calc(100vh-64px)] z-40">
            <div className="flex flex-col h-full gap-2 p-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-5 w-20 mt-2" />
              <div className="grid gap-1 flex-1 overflow-y-auto max-h-30">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
              <Separator className="bg-secondary/30" />
              <div className="grid gap-1 py-2">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
              <Skeleton className="h-4 w-16 mt-2" />
            </div>
          </aside>
          <main className="flex-1 md:ml-[240px] p-4 md:p-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <div>
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </div>
                <Skeleton className="ml-auto h-9 w-24" />
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-20" />
                ))}
              </div>
              <Skeleton className="h-32 w-full" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-5">
                  <Skeleton className="h-64 w-full" />
                </div>
                <div className="lg:col-span-2">
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_2fr] gap-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-secondary/50 to-secondary dark:from-background dark:to-background">      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-white/80 dark:bg-background/95 backdrop-blur-md px-6 shadow-sm">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-1.5">
            <LineChart className="h-5 w-5 text-white dark:text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            pahamsaham
          </span>
        </div>
        <StockTicker />
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1">        <aside className="hidden md:block border-r bg-white/80 dark:bg-background/95 backdrop-blur-sm fixed top-16 left-0 w-[240px] h-[calc(100vh-64px)] z-40">
          <div className="flex flex-col h-full gap-2 p-4">            <nav className="grid gap-1 py-2">
              <Button
                variant="ghost"
                className="justify-start gap-2 font-normal text-sm hover:bg-accent/10 hover:text-accent"
                asChild
              >
                <Link href="#">
                  <LineChart className="h-4 w-4" />
                  Saham
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2 font-normal text-sm hover:bg-accent/10 hover:text-accent"
                asChild
              >
                <Link href="/berita">
                  <Newspaper className="h-4 w-4" />
                  Berita
                </Link>
              </Button>
            </nav>
            <Separator className="bg-secondary/30" />
            <div className="flex items-center gap-2 mb-2">
              <Input
                type="search"
                placeholder="Cari saham..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 border-secondary/30 bg-white/80 focus:border-accent text-sm"
              />
            </div>            <h3 className="mb-2 text-sm font-medium text-primary dark:text-blue/60">Daftar Saham</h3>
            <div className="grid gap-1 flex-1 overflow-y-auto max-h-30">
              <div className="grid gap-1">
                {filteredEmiten.map((emiten) => (
                  <Button
                    key={emiten.ticker}
                    variant={activeStock === emiten.ticker ? "secondary" : "ghost"}
                    className={`justify-between h-auto py-2 text-sm ${activeStock === emiten.ticker ? "bg-primary/10 hover:bg-primary/20 text-primary border-none" : "hover:bg-primary/10"}`}
                    onClick={() => setActiveStock(emiten.ticker)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{emiten.ticker}</span>
                      <span className="text-xs text-muted-foreground">{emiten.name}</span>
                    </div>
                    {stockData && emiten.ticker === activeStock && (
                      <div
                        className={`flex items-center gap-1 ${stockData.changePercent >= 0 ? "text-accent" : "text-red-500"}`}
                      >
                        {stockData.changePercent >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        <span className="text-xs">{formatPercentage(Math.abs(stockData.changePercent))}</span>
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>
              <div className="mt-auto flex items-center gap-2 mb-2">
              <p className="text-sm text-muted-foreground">@Big-Data</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 md:ml-[240px] overflow-y-auto h-[calc(100vh-64px)]">
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex items-center">
              <div>
                <h1 className="text-lg font-semibold md:text-2xl text-primary">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Pantau pergerakan saham Indonesia secara real-time</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button className="bg-accent hover:bg-accent/90 text-white">Refresh</Button>
              </div>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="bg-white/80 dark:bg-background/80 p-1">                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Ringkasan
                </TabsTrigger>
                <TabsTrigger value="stocks" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Saham
                </TabsTrigger>
                <TabsTrigger
                  value="comparison"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Perbandingan
                </TabsTrigger>
                <TabsTrigger value="news" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Berita
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 slide-up">
                <div className="grid gap-4 md:grid-cols-2">
                  <MarketOverview />
                  <TopStocks />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="lg:col-span-5 bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="bg-primary text-white text-xs px-2 py-1 rounded">{activeStock}</span>
                        {initialEmiten.find((e) => e.ticker === activeStock)?.name || "Unknown"}
                      </CardTitle>
                      <CardDescription>
                        {stockData ? (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{formatCurrency(stockData.price)}</span>
                            <div
                              className={`flex items-center gap-1 ${stockData.change >= 0 ? "text-accent" : "text-red-500"}`}
                            >
                              {stockData.change >= 0 ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )}
                              <span>
                                {formatCurrency(Math.abs(stockData.change))} (
                                {formatPercentage(Math.abs(stockData.changePercent))})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-6 w-32" />
                          </div>
                        )}
                      </CardDescription>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-sm text-muted-foreground">Periode:</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-7">
                              {period.charAt(0).toUpperCase() + period.slice(1)}
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setPeriod("daily")}>Daily</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriod("monthly")}>Monthly</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPeriod("yearly")}>Yearly</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                      {isLoading ? (
                        <Skeleton className="h-48 w-full" />
                      ) : (
                        <StockChart data={priceData} />
                      )}
                    </CardContent>
                  </Card>
                  <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
                    <CardHeader>
                      <CardTitle>Detail Saham</CardTitle>
                    </CardHeader>
                    <CardContent>                      {stockData ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Open</div>
                            <div className="text-right font-medium">{formatCurrency(stockData.open)}</div>
                            <div className="text-muted-foreground">High</div>
                            <div className="text-right font-medium">{formatCurrency(stockData.high)}</div>
                            <div className="text-muted-foreground">Low</div>
                            <div className="text-right font-medium">{formatCurrency(stockData.low)}</div>
                            <div className="text-muted-foreground">Close</div>
                            <div className="text-right font-medium">{formatCurrency(stockData.price)}</div>
                            <div className="text-muted-foreground">Volume</div>
                            <div className="text-right font-medium">{formatVolume(stockData.volume)}</div>
                          </div>
                          <Separator className="bg-secondary/30 my-2" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {[...Array(5)].map((_, i) => (
                              <>
                                <Skeleton key={`label-${i}`} className="h-4 w-12" />
                                <Skeleton key={`value-${i}`} className="h-4 w-16 ml-auto" />
                              </>
                            ))}
                          </div>
                          <Separator className="bg-secondary/30" />                          <Separator className="bg-secondary/30 my-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>                <div className="grid grid-cols-[1fr_2fr] gap-4">
                  <StockFinancials financialData={financialData} />
                  <FinancialChartCard financialData={financialData} />
                </div>
                <StockNews />
              </TabsContent>
              <TabsContent value="stocks" className="space-y-4 slide-up">
                <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
                  <CardHeader>
                    <CardTitle>Daftar Saham</CardTitle>
                    <CardDescription>Daftar saham yang paling aktif diperdagangkan hari ini</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-secondary/5">
                          <TableHead>Kode</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead className="text-right">Harga</TableHead>
                          <TableHead className="text-right">Perubahan</TableHead>
                          <TableHead className="text-right">% Perubahan</TableHead>
                          <TableHead className="text-right">Volume</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {initialEmiten.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7}>
                              <div className="space-y-2">
                                {[...Array(5)].map((_, i) => (
                                  <Skeleton key={i} className="h-8 w-full" />
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          initialEmiten.map((emiten) => <StockRow key={emiten.ticker} emiten={emiten} />)
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full border-secondary/30 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                    >
                      Lihat Semua Saham
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="comparison" className="space-y-4 slide-up">
                <StockComparison />
              </TabsContent>
              <TabsContent value="news" className="space-y-4 slide-up">
                <StockNews fullPage={true} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}