"use client"

import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import StockChart from "@/components/stock-chart"
import MarketOverview from "@/components/market-overview"
import StockNews from "@/components/stock-news"
import StockTicker from "@/components/stock-ticker"
import StockComparison from "@/components/stock-comparison"
import PortfolioAnalytics from "@/components/portfolio-analytics"

export default function Dashboard() {
  const [activeStock, setActiveStock] = useState("BBCA")

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
        <aside className="hidden border-r md:block bg-white/80 backdrop-blur-sm">
          <div className="flex h-full flex-col gap-2 p-4">
            <div className="flex items-center gap-2">
              <Input placeholder="Cari saham..." className="h-9 border-secondary/30 bg-white/80 focus:border-accent" />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-secondary/30 bg-white/80 hover:bg-accent/10 hover:text-accent"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Cari</span>
              </Button>
            </div>
            <nav className="grid gap-1 py-2">
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
            <Separator className="bg-secondary/30" />
            <div className="py-2">
              <h3 className="mb-2 text-sm font-medium text-primary">Watchlist</h3>
              <div className="grid gap-2">
                <Button
                  variant="secondary"
                  className="justify-between h-auto py-2 bg-primary/10 hover:bg-primary/20 text-primary border-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">BBCA</span>
                    <span className="text-xs text-muted-foreground">BCA</span>
                  </div>
                  <div className="flex items-center gap-1 text-accent">
                    <ArrowUp className="h-3 w-3" />
                    <span className="text-xs">2,4%</span>
                  </div>
                </Button>
                <Button variant="ghost" className="justify-between h-auto py-2 hover:bg-primary/10">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">TLKM</span>
                    <span className="text-xs text-muted-foreground">Telkom</span>
                  </div>
                  <div className="flex items-center gap-1 text-accent">
                    <ArrowUp className="h-3 w-3" />
                    <span className="text-xs">1,2%</span>
                  </div>
                </Button>
                <Button variant="ghost" className="justify-between h-auto py-2 hover:bg-primary/10">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">ASII</span>
                    <span className="text-xs text-muted-foreground">Astra</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-500">
                    <ArrowDown className="h-3 w-3" />
                    <span className="text-xs">0,8%</span>
                  </div>
                </Button>
                <Button variant="ghost" className="justify-between h-auto py-2 hover:bg-primary/10">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">BBRI</span>
                    <span className="text-xs text-muted-foreground">BRI</span>
                  </div>
                  <div className="flex items-center gap-1 text-accent">
                    <ArrowUp className="h-3 w-3" />
                    <span className="text-xs">3,1%</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 border-dashed border-secondary/50 hover:bg-accent/10 hover:text-accent hover:border-accent"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Saham
                </Button>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center">
            <div>
              <h1 className="text-lg font-semibold md:text-2xl text-primary">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Pantau pergerakan saham Indonesia secara real-time</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-secondary/30 bg-white/80 hover:bg-accent/10 hover:text-accent"
                  >
                    Periode: 1D
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>1D</DropdownMenuItem>
                  <DropdownMenuItem>1W</DropdownMenuItem>
                  <DropdownMenuItem>1M</DropdownMenuItem>
                  <DropdownMenuItem>3M</DropdownMenuItem>
                  <DropdownMenuItem>1Y</DropdownMenuItem>
                  <DropdownMenuItem>5Y</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 overflow-hidden card-hover">
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">IHSG</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      IDX
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">7.234,56</div>
                    <div className="flex items-center gap-1 text-accent">
                      <ArrowUp className="h-4 w-4" />
                      <span>1,2%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 overflow-hidden card-hover">
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">LQ45</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      IDX
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">982,45</div>
                    <div className="flex items-center gap-1 text-accent">
                      <ArrowUp className="h-4 w-4" />
                      <span>0,8%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 overflow-hidden card-hover">
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">IDX80</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      IDX
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">234,56</div>
                    <div className="flex items-center gap-1 text-red-500">
                      <ArrowDown className="h-4 w-4" />
                      <span>0,3%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 overflow-hidden card-hover">
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">JII</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      IDX
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">567,23</div>
                    <div className="flex items-center gap-1 text-accent">
                      <ArrowUp className="h-4 w-4" />
                      <span>1,5%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-5 bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded">BBCA</span>
                      Bank Central Asia Tbk
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">Rp9.250</span>
                        <div className="flex items-center gap-1 text-accent">
                          <ArrowUp className="h-4 w-4" />
                          <span>Rp225 (2,4%)</span>
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <StockChart />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
                  <CardHeader>
                    <CardTitle>Detail Saham</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Open</div>
                        <div className="text-right font-medium">Rp9.100</div>
                        <div className="text-muted-foreground">High</div>
                        <div className="text-right font-medium">Rp9.300</div>
                        <div className="text-muted-foreground">Low</div>
                        <div className="text-right font-medium">Rp9.075</div>
                        <div className="text-muted-foreground">Close</div>
                        <div className="text-right font-medium">Rp9.250</div>
                        <div className="text-muted-foreground">Volume</div>
                        <div className="text-right font-medium">52,4M</div>
                        <div className="text-muted-foreground">Market Cap</div>
                        <div className="text-right font-medium">Rp1.140T</div>
                        <div className="text-muted-foreground">P/E Ratio</div>
                        <div className="text-right font-medium">24,8</div>
                        <div className="text-muted-foreground">Dividen</div>
                        <div className="text-right font-medium">1,2%</div>
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
                      <TableRow className="hover:bg-secondary/5">
                        <TableCell className="font-medium">BBCA</TableCell>
                        <TableCell>Bank Central Asia Tbk</TableCell>
                        <TableCell className="text-right">Rp9.250</TableCell>
                        <TableCell className="text-right text-accent">+Rp225</TableCell>
                        <TableCell className="text-right text-accent">+2,4%</TableCell>
                        <TableCell className="text-right">52,4M</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-secondary/5">
                        <TableCell className="font-medium">TLKM</TableCell>
                        <TableCell>Telkom Indonesia Tbk</TableCell>
                        <TableCell className="text-right">Rp3.780</TableCell>
                        <TableCell className="text-right text-accent">+Rp45</TableCell>
                        <TableCell className="text-right text-accent">+1,2%</TableCell>
                        <TableCell className="text-right">23,1M</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-secondary/5">
                        <TableCell className="font-medium">ASII</TableCell>
                        <TableCell>Astra International Tbk</TableCell>
                        <TableCell className="text-right">Rp4.560</TableCell>
                        <TableCell className="text-right text-red-500">-Rp40</TableCell>
                        <TableCell className="text-right text-red-500">-0,8%</TableCell>
                        <TableCell className="text-right">18,7M</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-secondary/5">
                        <TableCell className="font-medium">BBRI</TableCell>
                        <TableCell>Bank Rakyat Indonesia Tbk</TableCell>
                        <TableCell className="text-right">Rp5.175</TableCell>
                        <TableCell className="text-right text-accent">+Rp150</TableCell>
                        <TableCell className="text-right text-accent">+3,1%</TableCell>
                        <TableCell className="text-right">32,8M</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-secondary/5">
                        <TableCell className="font-medium">UNVR</TableCell>
                        <TableCell>Unilever Indonesia Tbk</TableCell>
                        <TableCell className="text-right">Rp3.450</TableCell>
                        <TableCell className="text-right text-red-500">-Rp50</TableCell>
                        <TableCell className="text-right text-red-500">-1,4%</TableCell>
                        <TableCell className="text-right">15,2M</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
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
                        <TableCell className="font-medium">BBCA</TableCell>
                        <TableCell>Bank Central Asia Tbk</TableCell>
                        <TableCell className="text-right">2.500</TableCell>
                        <TableCell className="text-right">Rp8.750</TableCell>
                        <TableCell className="text-right">Rp9.250</TableCell>
                        <TableCell className="text-right">Rp23.125.000</TableCell>
                        <TableCell className="text-right text-accent">+Rp1.250.000</TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-secondary/5">
                        <TableCell className="font-medium">TLKM</TableCell>
                        <TableCell>Telkom Indonesia Tbk</TableCell>
                        <TableCell className="text-right">5.000</TableCell>
                        <TableCell className="text-right">Rp3.650</TableCell>
                        <TableCell className="text-right">Rp3.780</TableCell>
                        <TableCell className="text-right">Rp18.900.000</TableCell>
                        <TableCell className="text-right text-accent">+Rp650.000</TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-secondary/5">
                        <TableCell className="font-medium">BBRI</TableCell>
                        <TableCell>Bank Rakyat Indonesia Tbk</TableCell>
                        <TableCell className="text-right">4.000</TableCell>
                        <TableCell className="text-right">Rp4.950</TableCell>
                        <TableCell className="text-right">Rp5.175</TableCell>
                        <TableCell className="text-right">Rp20.700.000</TableCell>
                        <TableCell className="text-right text-accent">+Rp900.000</TableCell>
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
  )
}
