"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const stocks = [
  { value: "BBCA", label: "Bank Central Asia Tbk", sector: "Perbankan" },
  { value: "BBRI", label: "Bank Rakyat Indonesia Tbk", sector: "Perbankan" },
  { value: "BMRI", label: "Bank Mandiri Tbk", sector: "Perbankan" },
  { value: "TLKM", label: "Telkom Indonesia Tbk", sector: "Telekomunikasi" },
  { value: "ASII", label: "Astra International Tbk", sector: "Otomotif" },
  { value: "UNVR", label: "Unilever Indonesia Tbk", sector: "Konsumer" },
  { value: "ICBP", label: "Indofood CBP Sukses Makmur Tbk", sector: "Konsumer" },
  { value: "INDF", label: "Indofood Sukses Makmur Tbk", sector: "Konsumer" },
  { value: "ANTM", label: "Aneka Tambang Tbk", sector: "Pertambangan" },
  { value: "PTBA", label: "Bukit Asam Tbk", sector: "Pertambangan" },
]

export default function StockComparison() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>(["BBCA", "BBRI", "TLKM"])
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleAddStock = (value: string) => {
    if (selectedStocks.length < 5 && !selectedStocks.includes(value)) {
      setSelectedStocks([...selectedStocks, value])
    }
    setOpen(false)
  }

  const handleRemoveStock = (value: string) => {
    setSelectedStocks(selectedStocks.filter((stock) => stock !== value))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Chart settings
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw chart background
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Sample data - would come from API in real app
    const stockData = {
      BBCA: [100, 102, 105, 103, 106, 110, 112, 115, 118, 120, 122, 124],
      BBRI: [100, 103, 106, 104, 108, 112, 110, 113, 116, 119, 121, 123],
      TLKM: [100, 101, 103, 102, 104, 105, 106, 108, 107, 109, 110, 112],
      ASII: [100, 98, 97, 99, 101, 103, 102, 104, 106, 105, 107, 108],
      UNVR: [100, 99, 101, 100, 102, 101, 103, 104, 105, 106, 107, 108],
    }

    // Find min and max values across all selected stocks
    let minValue = Number.MAX_VALUE
    let maxValue = Number.MIN_VALUE

    selectedStocks.forEach((stock) => {
      const data = stockData[stock as keyof typeof stockData]
      if (data) {
        minValue = Math.min(minValue, ...data)
        maxValue = Math.max(maxValue, ...data)
      }
    })

    // Add some padding to min/max
    minValue = minValue * 0.95
    maxValue = maxValue * 1.05
    const valueRange = maxValue - minValue

    // Draw grid lines
    ctx.strokeStyle = "rgba(30, 58, 138, 0.1)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (chartHeight / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + chartWidth, y)
      ctx.stroke()

      // Add price labels
      const value = maxValue - (valueRange / gridLines) * i
      ctx.fillStyle = "#64748b"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(`${value.toFixed(0)}%`, padding - 5, y + 3)
    }

    // Draw vertical grid lines (months)
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

    for (let i = 0; i < months.length; i++) {
      const x = padding + (chartWidth / (months.length - 1)) * i
      ctx.beginPath()
      ctx.moveTo(x, padding + chartHeight)
      ctx.lineTo(x, padding + chartHeight + 5)
      ctx.stroke()

      // Add month labels
      ctx.fillStyle = "#64748b"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(months[i], x, padding + chartHeight + 15)
    }

    // Draw lines for each selected stock
    const colors = {
      BBCA: "#1E3A8A",
      BBRI: "#10B981",
      TLKM: "#6366F1",
      ASII: "#F59E0B",
      UNVR: "#EC4899",
    }

    selectedStocks.forEach((stock) => {
      const data = stockData[stock as keyof typeof stockData]
      if (!data) return

      // Draw line
      ctx.strokeStyle = colors[stock as keyof typeof colors] || "#000000"
      ctx.lineWidth = 2
      ctx.beginPath()

      // Plot data points
      data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      ctx.stroke()

      // Add data points
      ctx.fillStyle = "#ffffff"
      ctx.strokeStyle = colors[stock as keyof typeof colors] || "#000000"
      ctx.lineWidth = 2

      data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index
        const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

        // Only draw points for first, last, and every 3rd data point
        if (index === 0 || index === data.length - 1 || index % 3 === 0) {
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
      })
    })

    // Draw legend
    const legendX = padding
    const legendY = padding - 15
    const legendSpacing = 80

    selectedStocks.forEach((stock, index) => {
      const x = legendX + index * legendSpacing

      // Draw color line
      ctx.strokeStyle = colors[stock as keyof typeof colors] || "#000000"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, legendY)
      ctx.lineTo(x + 15, legendY)
      ctx.stroke()

      // Draw label
      ctx.fillStyle = "#64748b"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(stock, x + 20, legendY)
    })
  }, [selectedStocks])

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
      <CardHeader>
        <CardTitle>Perbandingan Saham</CardTitle>
        <CardDescription>Bandingkan performa relatif beberapa saham (basis 100)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedStocks.map((stock) => (
            <Badge key={stock} className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1 py-1.5">
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
                  className="border-dashed border-secondary/50 hover:bg-accent/10 hover:text-accent hover:border-accent h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Saham
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Cari saham..." />
                  <CommandList>
                    <CommandEmpty>Saham tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {stocks.map((stock) => (
                        <CommandItem
                          key={stock.value}
                          value={stock.value}
                          onSelect={() => handleAddStock(stock.value)}
                          disabled={selectedStocks.includes(stock.value)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStocks.includes(stock.value) ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {stock.value} - {stock.label.split(" ")[0]}
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
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {selectedStocks.slice(0, 3).map((stock) => {
            const stockInfo = stocks.find((s) => s.value === stock)
            return (
              <div key={stock} className="bg-secondary/20 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-white">{stock}</Badge>
                    <span className="text-sm font-medium">{stockInfo?.label.split(" ")[0]}</span>
                  </div>
                  <Badge variant="outline" className="bg-secondary/30 text-muted-foreground">
                    {stockInfo?.sector}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Performa 1 Tahun: <span className="text-accent font-medium">+24%</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
