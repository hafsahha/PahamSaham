"use client"

import { useEffect, useRef } from "react"

export default function StockChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Sample data - would come from API in real app
    const data = [
      9050, 9075, 9100, 9125, 9150, 9175, 9200, 9150, 9175, 9200, 9225, 9250, 9225, 9250, 9275, 9250, 9225, 9250, 9275,
      9250,
    ]

    // Chart settings
    const padding = 20
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    // Find min and max values
    const minValue = Math.min(...data) * 0.998
    const maxValue = Math.max(...data) * 1.002
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
      ctx.fillText(`Rp${value.toLocaleString("id-ID")}`, padding - 5, y + 3)
    }

    // Draw line chart
    ctx.strokeStyle = "#10B981"
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
    gradient.addColorStop(0, "rgba(16, 185, 129, 0.2)")
    gradient.addColorStop(1, "rgba(16, 185, 129, 0)")

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
    ctx.strokeStyle = "#10B981"
    ctx.lineWidth = 2

    data.forEach((value, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight

      // Only draw points for every 4th data point to avoid clutter
      if (index % 4 === 0 || index === data.length - 1) {
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
    })

    // Add time labels
    const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]
    const timeStep = Math.floor(data.length / (times.length - 1))

    times.forEach((time, i) => {
      const index = i * timeStep
      if (index < data.length) {
        const x = padding + (chartWidth / (data.length - 1)) * index
        ctx.fillStyle = "#64748b"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(time, x, padding + chartHeight + 15)
      }
    })
  }, [])

  return (
    <div className="w-full h-[300px] relative">
      <div className="absolute top-2 right-2 flex gap-2">
        <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">1D</div>
        <div className="text-xs px-2 py-1 rounded-full bg-secondary/30 text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer">
          1W
        </div>
        <div className="text-xs px-2 py-1 rounded-full bg-secondary/30 text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer">
          1M
        </div>
        <div className="text-xs px-2 py-1 rounded-full bg-secondary/30 text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer">
          1Y
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
