"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useEffect, useRef } from "react"

export default function PortfolioAnalytics() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Line chart for portfolio performance
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Sample data - would come from API in real app
    const data = [
      235000000, 238000000, 242000000, 240000000, 245000000, 248000000, 246000000, 250000000, 252000000, 255000000,
      260000000, 265000000,
    ]

    // Chart settings
    const padding = 20
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    // Find min and max values
    const minValue = Math.min(...data) * 0.995
    const maxValue = Math.max(...data) * 1.005
    const valueRange = maxValue - minValue

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw chart background
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

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
      ctx.fillText(`Rp${(value / 1000000).toFixed(1)}M`, padding - 5, y + 3)
    }

    // Draw line chart
    ctx.strokeStyle = "#1E3A8A"
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

    // Add gradient fill under the line
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight)
    gradient.addColorStop(0, "rgba(30, 58, 138, 0.2)")
    gradient.addColorStop(1, "rgba(30, 58, 138, 0)")

    ctx.fillStyle = gradient
    ctx.beginPath()

    // Start from bottom left
    ctx.moveTo(padding, padding + chartHeight)

    // Plot data points again
    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight
      ctx.lineTo(x, y)
    })

    // Complete the path to bottom right
    ctx.lineTo(padding + chartWidth, padding + chartHeight)
    ctx.closePath()
    ctx.fill()

    // Add data points
    ctx.fillStyle = "#ffffff"
    ctx.strokeStyle = "#1E3A8A"
    ctx.lineWidth = 2

    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

      // Only draw points for every 3rd data point to avoid clutter
      if (index % 3 === 0 || index === data.length - 1) {
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
    })

    // Add month labels
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

    months.forEach((month, i) => {
      if (i < data.length) {
        const x = padding + (chartWidth / (data.length - 1)) * i
        ctx.fillStyle = "#64748b"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(month, x, padding + chartHeight + 15)
      }
    })

    // Pie chart for portfolio allocation
    const pieCanvas = pieChartRef.current
    if (!pieCanvas) return

    const pieCtx = pieCanvas.getContext("2d")
    if (!pieCtx) return

    // Set canvas dimensions
    pieCanvas.width = pieCanvas.offsetWidth
    pieCanvas.height = pieCanvas.offsetHeight

    // Sample data - would come from API in real app
    const pieData = [
      { label: "Perbankan", value: 45, color: "#1E3A8A" },
      { label: "Telekomunikasi", value: 20, color: "#10B981" },
      { label: "Konsumer", value: 15, color: "#6366F1" },
      { label: "Properti", value: 10, color: "#F59E0B" },
      { label: "Lainnya", value: 10, color: "#EC4899" },
    ]

    // Clear canvas
    pieCtx.clearRect(0, 0, pieCanvas.width, pieCanvas.height)

    // Draw pie chart
    const centerX = pieCanvas.width / 2
    const centerY = pieCanvas.height / 2
    const radius = Math.min(centerX, centerY) - 40

    let startAngle = 0
    const total = pieData.reduce((sum, item) => sum + item.value, 0)

    pieData.forEach((item) => {
      const sliceAngle = (2 * Math.PI * item.value) / total

      // Draw slice
      pieCtx.beginPath()
      pieCtx.moveTo(centerX, centerY)
      pieCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      pieCtx.closePath()
      pieCtx.fillStyle = item.color
      pieCtx.fill()

      // Draw label
      const labelAngle = startAngle + sliceAngle / 2
      const labelRadius = radius * 0.7
      const labelX = centerX + labelRadius * Math.cos(labelAngle)
      const labelY = centerY + labelRadius * Math.sin(labelAngle)

      pieCtx.fillStyle = "#FFFFFF"
      pieCtx.font = "bold 12px sans-serif"
      pieCtx.textAlign = "center"
      pieCtx.textBaseline = "middle"
      pieCtx.fillText(`${item.value}%`, labelX, labelY)

      startAngle += sliceAngle
    })

    // Draw center circle (donut hole)
    pieCtx.beginPath()
    pieCtx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI)
    pieCtx.fillStyle = "#FFFFFF"
    pieCtx.fill()

    // Draw title in center
    pieCtx.fillStyle = "#1E3A8A"
    pieCtx.font = "bold 14px sans-serif"
    pieCtx.textAlign = "center"
    pieCtx.textBaseline = "middle"
    pieCtx.fillText("Alokasi", centerX, centerY - 10)
    pieCtx.fillText("Portofolio", centerX, centerY + 10)

    // Draw legend
    const legendX = pieCanvas.width - 100
    const legendY = 30
    const legendSpacing = 25

    pieData.forEach((item, index) => {
      const y = legendY + index * legendSpacing

      // Draw color box
      pieCtx.fillStyle = item.color
      pieCtx.fillRect(legendX, y, 15, 15)

      // Draw label
      pieCtx.fillStyle = "#64748b"
      pieCtx.font = "12px sans-serif"
      pieCtx.textAlign = "left"
      pieCtx.textBaseline = "middle"
      pieCtx.fillText(item.label, legendX + 20, y + 7.5)
    })
  }, [])

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
      <CardHeader>
        <CardTitle>Portofolio Saya</CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>
            Nilai total portofolio: <span className="font-medium">Rp265.678.900</span>
          </span>
          <div className="flex gap-2">
            <Badge className="bg-accent text-white">+Rp2.800.000</Badge>
            <Badge className="bg-accent/20 text-accent">+1,2%</Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance">
          <TabsList className="mb-4 bg-secondary/20">
            <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Performa
            </TabsTrigger>
            <TabsTrigger value="allocation" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Alokasi
            </TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Ringkasan
            </TabsTrigger>
          </TabsList>
          <TabsContent value="performance">
            <div className="h-[300px] w-full">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
          </TabsContent>
          <TabsContent value="allocation">
            <div className="h-[300px] w-full">
              <canvas ref={pieChartRef} className="w-full h-full" />
            </div>
          </TabsContent>
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Performa Portofolio</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Hari Ini</div>
                      <div className="text-lg font-medium text-accent">+1,2%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">1 Minggu</div>
                      <div className="text-lg font-medium text-accent">+2,8%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">1 Bulan</div>
                      <div className="text-lg font-medium text-accent">+5,4%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">1 Tahun</div>
                      <div className="text-lg font-medium text-accent">+12,7%</div>
                    </div>
                  </div>
                </div>
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Dividen</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Tahun Ini</div>
                      <div className="text-lg font-medium">Rp4.250.000</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Yield</div>
                      <div className="text-lg font-medium">1,6%</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Saham Terbaik</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-white">BBRI</Badge>
                        <span className="text-sm">Bank BRI</span>
                      </div>
                      <div className="text-accent">+15,2%</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-white">TLKM</Badge>
                        <span className="text-sm">Telkom</span>
                      </div>
                      <div className="text-accent">+8,7%</div>
                    </div>
                  </div>
                </div>
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Saham Terburuk</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-white">UNVR</Badge>
                        <span className="text-sm">Unilever</span>
                      </div>
                      <div className="text-red-500">-3,5%</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-white">ASII</Badge>
                        <span className="text-sm">Astra</span>
                      </div>
                      <div className="text-red-500">-1,2%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
