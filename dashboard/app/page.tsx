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

// Interface untuk tipe data dari API
interface Emiten {
  ticker: string;
  name: string;
}

interface PriceData {
  Close: number;
  Date: string;
  High: number;
  Low: number;
  Open: number;
  Symbol: string;
  Volume: number;
}

interface StockData {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

// Fungsi untuk fetch data emiten
async function fetchEmiten(): Promise<Emiten[]> {
  try {
    const apiUrl = "http://localhost:5000/api/emiten"; // Jalankan lokal
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Failed to fetch emiten: ${res.status} ${res.statusText}`);
    }
    const tickers: string[] = await res.json();
    console.log("Fetched emitens:", tickers); // Debugging
    return tickers.map(ticker => ({ ticker, name: ticker.split('.')[0] }));
  } catch (error) {
    console.error("Error fetching emitens:", error);
    return [{ ticker: "BBRI.JK", name: "BBRI" }]; // Fallback jika API gagal
  }
}

// Fungsi untuk fetch data harga
async function fetchPriceData(emiten: string, period: string): Promise<PriceData[]> {
  try {
    const apiUrl = `http://localhost:5000/api/harga?emiten=${emiten}&period=${period}`; // Jalankan lokal
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch price data");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Komponen untuk baris tabel saham
function StockRow({ emiten }: { emiten: Emiten }) {
  const [stockPriceData, setStockPriceData] = useState<StockData | null>(null);

  useEffect(() => {
    async function loadStockPrice() {
      const data = await fetchPriceData(emiten.ticker, "yearly");
      setStockPriceData(calculateStockData(data));
    }
    loadStockPrice();
  }, [emiten.ticker]);

  const formatCurrency = (value: number) => `Rp${value.toLocaleString("id-ID")}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatVolume = (value: number) => `${(value / 1000000).toFixed(1)}M`;

  return (
    <TableRow className="hover:bg-secondary/5">
      <TableCell className="font-medium">{emiten.ticker}</TableCell>
      <TableCell>{emiten.name}</TableCell>
      <TableCell className="text-right">
        {stockPriceData ? formatCurrency(stockPriceData.price) : "N/A"}
      </TableCell>
      <TableCell
        className={`text-right ${stockPriceData && stockPriceData.change >= 0 ? "text-accent" : "text-red-500"}`}
      >
        {stockPriceData ? (stockPriceData.change >= 0 ? "+" : "-") + formatCurrency(Math.abs(stockPriceData.change)) : "N/A"}
      </TableCell>
      <TableCell
        className={`text-right ${stockPriceData && stockPriceData.changePercent >= 0 ? "text-accent" : "text-red-500"}`}
      >
        {stockPriceData ? (stockPriceData.changePercent >= 0 ? "+" : "-") + formatPercentage(Math.abs(stockPriceData.changePercent)) : "N/A"}
      </TableCell>
      <TableCell className="text-right">
        {stockPriceData ? formatVolume(stockPriceData.volume) : "N/A"}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent">
          <Plus className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// Hitung data saham (price, change, dll.) dari data harga
function calculateStockData(prices: PriceData[]): StockData | null {
  if (prices.length < 1) return null;
  const latest = prices[prices.length - 1];
  const previous = prices.length > 1 ? prices[prices.length - 2] : null;
  
  const price = latest.Close;
  const change = previous ? price - previous.Close : 0;
  const changePercent = previous ? (change / previous.Close) * 100 : 0;

  return {
    price,
    change,
    changePercent,
    open: latest.Open,
    high: latest.High,
    low: latest.Low,
    volume: latest.Volume,
  };
}

// Komponen Client
export default function Dashboard() {
  const [initialEmiten, setInitialEmiten] = useState<Emiten[]>([]);
  const [activeStock, setActiveStock] = useState("BBRI.JK");
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // State untuk pencarian

  // Fetch daftar emiten saat komponen dimuat
  useEffect(() => {
    async function loadInitialEmiten() {
      setIsLoading(true);
      const emitens = await fetchEmiten();
      setInitialEmiten(emitens);
      setActiveStock(emitens[0]?.ticker || "BBRI.JK");
      setIsLoading(false);
    }
    loadInitialEmiten();
  }, []);

  // Fetch data harga saat activeStock berubah
  useEffect(() => {
    async function loadPriceData() {
      if (!activeStock) return;
      const data = await fetchPriceData(activeStock, "yearly");
      setPriceData(data);
      setStockData(calculateStockData(data));
    }
    loadPriceData();
  }, [activeStock]);

  // Filter emiten berdasarkan pencarian
  const filteredEmiten = initialEmiten.filter(emiten =>
    emiten.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emiten.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (value: number) => `Rp${value.toLocaleString("id-ID")}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatVolume = (value: number) => `${(value / 1000000).toFixed(1)}M`;

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
            <span>Loading...</span>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

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
        <StockTicker />
        <div className="ml-auto flex items-center gap-4">
          <form className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari saham..."
                className="w-64 pl-8 border-secondary/30 bg-white/80 focus:border-accent"
              />
            </div>
          </form>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-secondary/30 bg-white/80 hover:bg-accent/10 hover:text-accent relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
              3
            </span>
            <span className="sr-only">Notifikasi</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-secondary/30 bg-white/80 hover:bg-accent/10 hover:text-accent"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Pengaturan</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 rounded-full border-secondary/30 bg-white/80 hover:bg-accent/10 hover:text-accent"
              >
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                  JD
                </div>
                <span className="hidden md:inline-flex">John Doe</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Pengaturan</DropdownMenuItem>
              <DropdownMenuItem>Langganan</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Keluar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="grid flex-1 md:grid-cols-[240px_1fr]">
        <aside className="hidden md:block border-r bg-white/80 backdrop-blur-sm sticky top-0 h-screen"> {/* Sticky sidebar */}
          <div className="flex h-full flex-col gap-2 p-4">
            <div className="flex items-center gap-">
              <Input
                placeholder="Cari saham..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 border-secondary/30 bg-white/80 focus:border-accent"
              />
              {/* <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-secondary/30 bg-white/80 hover:bg-accent/10 hover:text-accent"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Cari</span>
              </Button> */}
            </div>

            <div className="py-2">
              <h3 className="mb-2 text-sm font-medium text-primary">Watchlist</h3>
              <div className="grid gap-1 max-h-40 overflow-y-auto">
                {filteredEmiten.map((emiten) => (
                  <Button
                    key={emiten.ticker}
                    variant={activeStock === emiten.ticker ? "secondary" : "ghost"}
                    className={`justify-between h-auto py-2 ${activeStock === emiten.ticker ? "bg-primary/10 hover:bg-primary/20 text-primary border-none" : "hover:bg-primary/10"}`}
                    onClick={() => setActiveStock(emiten.ticker)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{emiten.ticker}</span>
                      <span className="text-xs text-muted-foreground">{emiten.name}</span>
                    </div>
                    {stockData && emiten.ticker === activeStock && (
                      <div className={`flex items-center gap-1 ${stockData.changePercent >= 0 ? "text-accent" : "text-red-500"}`}>
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
            <Separator className="bg-secondary/30" />
            <nav className="grid gap-1 py-">
              <Button
                variant="ghost"
                className="justify-start gap-2 font-normal hover:bg-accent/10 hover:text-accent"
                asChild
              >
                <Link href="#">
                  <TrendingUp className="h-4 w-4" />
                  Ringkasan Pasar
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2 font-normal hover:bg-accent/10 hover:text-accent"
                asChild
              >
                <Link href="#">
                  <Star className="h-4 w-4" />
                  Watchlist
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2 font-normal hover:bg-accent/10 hover:text-accent"
                asChild
              >
                <Link href="#">
                  <Briefcase className="h-4 w-4" />
                  Portofolio
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2 font-normal hover:bg-accent/10 hover:text-accent"
                asChild
              >
                <Link href="#">
                  <BarChart3 className="h-4 w-4" />
                  Analisis Teknikal
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2 font-normal hover:bg-accent/10 hover:text-accent"
                asChild
              >
                <Link href="#">
                  <Newspaper className="h-4 w-4" />
                  Berita & Analisis
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2 font-normal hover:bg-accent/10 hover:text-accent"
                asChild
              >
                <Link href="#">
                  <Globe className="h-4 w-4" />
                  Pasar Global
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="justify-start gap-2 font-normal hover:bg-accent/10 hover:text-accent"
                asChild
              >
                <Link href="#">
                  <Clock className="h-4 w-4" />
                  Riwayat
                </Link>
              </Button>
            </nav>
          </div>
        </aside>

        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
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
            <TabsList className="bg-white/80 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Ringkasan
              </TabsTrigger>
              <TabsTrigger value="stocks" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Saham
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Portofolio
              </TabsTrigger>
              <TabsTrigger value="comparison" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Perbandingan
              </TabsTrigger>
              <TabsTrigger value="news" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                Berita
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 slide-up">
              <MarketOverview />
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
                          <div className={`flex items-center gap-1 ${stockData.change >= 0 ? "text-accent" : "text-red-500"}`}>
                            {stockData.change >= 0 ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )}
                            <span>{formatCurrency(Math.abs(stockData.change))} ({formatPercentage(Math.abs(stockData.changePercent))})</span>
                          </div>
                        </div>
                      ) : (
                        <div>Loading...</div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <StockChart data={priceData} />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
                  <CardHeader>
                    <CardTitle>Detail Saham</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stockData ? (
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
                        <Separator className="bg-secondary/30" />
                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            className="border-secondary/30 bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                          >
                            Beli
                          </Button>
                          <Button className="bg-accent hover:bg-accent/90 text-white">Tambah ke Watchlist</Button>
                        </div>
                      </div>
                    ) : (
                      <div>Loading...</div>
                    )}
                  </CardContent>
                </Card>
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
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {initialEmiten.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">Loading saham...</TableCell>
                        </TableRow>
                      ) : (
                        initialEmiten.map((emiten) => (
                          <StockRow key={emiten.ticker} emiten={emiten} />
                        ))
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
            <TabsContent value="portfolio" className="space-y-4 slide-up">
              <PortfolioAnalytics />
              <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
                <CardHeader>
                  <CardTitle>Saham yang Dimiliki</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-secondary/5">
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">Harga Beli</TableHead>
                        <TableHead className="text-right">Harga Saat Ini</TableHead>
                        <TableHead className="text-right">Nilai</TableHead>
                        <TableHead className="text-right">P/L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-secondary/5">
                        <TableCell colSpan={7}>Data portofolio belum tersedia</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="comparison" className="space-y-4 slide-up">
              <StockComparison />
            </TabsContent>
            <TabsContent value="news" className="space-y-4 slide-up">
              <StockNews fullPage={true} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}