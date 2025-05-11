"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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

// Fungsi untuk fetch data emiten
async function fetchEmiten(): Promise<Emiten[]> {
  try {
    const apiUrl = "http://localhost:5000/api/emiten";
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch emiten: ${res.status} ${res.statusText}`);
    const tickers: string[] = await res.json();
    return tickers.map(ticker => ({ ticker, name: ticker.split('.')[0] }));
  } catch (error) {
    console.error("Error fetching emitens:", error);
    return [{ ticker: "BBRI.JK", name: "BBRI" }];
  }
}

// Fungsi untuk fetch data harga
async function fetchPriceData(emiten: string, period: string): Promise<PriceData[]> {
  try {
    const apiUrl = `http://localhost:5000/api/harga?emiten=${emiten}&period=${period}`;
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch price data");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

const CustomTooltip = ({ active, payload, label, selectedStocks }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
        <p className="text-xs text-gray-600">Tanggal: {label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index}>
            <p className="font-bold text-xs">{entry.name}</p>
            <p className="text-xs">
              Harga: <span className="font-medium">Rp {entry.value.toLocaleString("id-ID")}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function StockComparison() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>(["AGRO.JK", "ADES.JK"]);
  const [open, setOpen] = useState(false);
  const [priceData, setPriceData] = useState<{ [key: string]: PriceData[] }>({});
  const [emitens, setEmitens] = useState<Emiten[]>([]);

  // Fetch daftar emiten saat komponen dimuat
  useEffect(() => {
    async function loadEmitens() {
      const fetchedEmitens = await fetchEmiten();
      setEmitens(fetchedEmitens);
    }
    loadEmitens();
  }, []);

  // Fetch data harga untuk selected stocks
  useEffect(() => {
    async function fetchAllPriceData() {
      const data: { [key: string]: PriceData[] } = {};
      for (const stock of selectedStocks) {
        const response = await fetchPriceData(stock, "yearly");
        data[stock] = response;
      }
      setPriceData(data);
    }
    if (selectedStocks.length > 0) {
      fetchAllPriceData();
    }
  }, [selectedStocks]);

  const handleAddStock = (value: string) => {
    if (selectedStocks.length < 5 && !selectedStocks.includes(value)) {
      setSelectedStocks([...selectedStocks, value]);
    }
    setOpen(false);
  };

  const handleRemoveStock = (value: string) => {
    setSelectedStocks(selectedStocks.filter((stock) => stock !== value));
  };

  // Prepare chart data with original prices
  const chartData = selectedStocks.reduce((acc, stock) => {
    const stockData = priceData[stock] || [];
    stockData.forEach((item) => {
      const existing = acc.find((d) => d.Date === item.Date);
      if (existing) {
        existing[stock] = item.Close;
      } else {
        acc.push({ Date: item.Date, [stock]: item.Close });
      }
    });
    return acc;
  }, [] as { Date: string; [key: string]: number | string }[]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
      <CardHeader>
        <CardTitle className="text-lg">Perbandingan Saham</CardTitle>
        <CardDescription className="text-xs">Bandingkan performa relatif beberapa saham</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedStocks.map((stock) => (
            <Badge key={stock} className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1 py-1 text-xs">
              {stock}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full p-0 ml-1 hover:bg-red-500/10 hover:text-red-500"
                onClick={() => handleRemoveStock(stock)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {selectedStocks.length < 5 && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="border-dashed border-secondary/50 hover:bg-accent/10 hover:text-accent h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Tambah Saham
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Cari saham..." className="text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-xs">Saham tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {emitens.map((emiten) => (
                        <CommandItem
                          key={emiten.ticker}
                          value={emiten.ticker}
                          onSelect={() => handleAddStock(emiten.ticker)}
                          disabled={selectedStocks.includes(emiten.ticker)}
                          className="text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              selectedStocks.includes(emiten.ticker) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {emiten.ticker} - {emiten.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <Separator className="my-4 bg-secondary/30" />

        <div className="h-[400px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="Date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value: string) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    // Default to the first stock for percentage calculation
                    return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
                  }}
                />
                <Tooltip content={<CustomTooltip selectedStocks={selectedStocks} />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {selectedStocks.map((stock, index) => (
                  <Line
                    key={stock}
                    type="monotone"
                    dataKey={stock}
                    stroke={["#1E3A8A", "#10B981", "#6366F1", "#F59E0B", "#EC4899"][index % 5]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                    name={stock}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Tidak ada data untuk ditampilkan
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedStocks.map((stock) => {
            const emiten = emitens.find((e) => e.ticker === stock);
            const data = priceData[stock] || [];
            let latestPrice = 0;
            let initialPrice = 0;
            let performance = 0;

            if (data.length > 0) {
              // Find the latest price (most recent date)
              latestPrice = data[data.length - 1].Close;

              // Find the initial price from 1 year ago (approximate)
              const oneYearAgo = new Date();
              oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1); // May 11, 2024
              const initialData = data
                .filter((item) => new Date(item.Date) <= oneYearAgo)
                .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0]; // Closest to 1 year ago
              initialPrice = initialData ? initialData.Close : latestPrice; // Fallback to latest if no earlier data

              // Calculate performance as percentage change
              performance = initialPrice !== 0 ? ((latestPrice - initialPrice) / initialPrice) * 100 : 0;
            }

            return (
              <div key={stock} className="bg-secondary/20 p-2 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <Badge className="bg-primary text-white text-xs">{stock}</Badge>
                    <span className="text-xs font-medium">{emiten?.name || stock}</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Performa 1 Tahun: <span className={`font-medium ${performance >= 0 ? "text-accent" : "text-red-500"}`}>
                    {performance.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}