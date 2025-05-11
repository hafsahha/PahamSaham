"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card } from "@/components/ui/card"

interface PriceData {
  Symbol: string
  Date: string
  Open: number
  High: number
  Low: number
  Close: number
  Volume: number
}

interface PriceChartProps {
  data: PriceData[]
}

// Update the CustomTooltip component for better dark mode visibility
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <Card className="bg-card dark:bg-card p-4 shadow-lg border border-border dark:border-border">
        <p className="font-bold text-foreground dark:text-foreground">{data.Symbol}</p>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">Tanggal: {data.Date}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          <p className="text-sm">
            <span className="text-muted-foreground dark:text-muted-foreground">Open:</span>{" "}
            <span className="font-medium text-foreground dark:text-foreground">
              Rp {data.Open.toLocaleString("id-ID")}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground dark:text-muted-foreground">Close:</span>{" "}
            <span className="font-medium text-foreground dark:text-foreground">
              Rp {data.Close.toLocaleString("id-ID")}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground dark:text-muted-foreground">High:</span>{" "}
            <span className="font-medium text-green-600 dark:text-green-400">
              Rp {data.High.toLocaleString("id-ID")}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground dark:text-muted-foreground">Low:</span>{" "}
            <span className="font-medium text-red-600 dark:text-red-400">Rp {data.Low.toLocaleString("id-ID")}</span>
          </p>
        </div>
        <p className="text-sm mt-1">
          <span className="text-muted-foreground dark:text-muted-foreground">Volume:</span>{" "}
          <span className="font-medium text-foreground dark:text-foreground">
            {data.Volume.toLocaleString("id-ID")}
          </span>
        </p>
      </Card>
    )
  }
  return null
}

export default function StockChart({ data }: PriceChartProps) {
  const [activeDataKey, setActiveDataKey] = useState<string>("Close")
  const [selectedRange, setSelectedRange] = useState<string>("all")

  // Ensure dates are sorted chronologically
  const sortedData = [...data].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime())

  // Filter data based on selected range
  const formattedData = filterByRange(sortedData, selectedRange)

  const handleLegendClick = (dataKey: string) => {
    setActiveDataKey(dataKey)
  }

  // Calculate min and max values for Y axis with some padding
  const allValues = formattedData.flatMap((item) => [item.Open, item.High, item.Low, item.Close])
  const minValue = allValues.length > 0 ? Math.min(...allValues) * 0.95 : 0
  const maxValue = allValues.length > 0 ? Math.max(...allValues) * 1.05 : 100

  function filterByRange(data: PriceData[], range: string): PriceData[] {
    if (!data.length || range === "all") return data

    const endDate = new Date(data[data.length - 1].Date)
    const startDate = new Date(endDate)

    switch (range) {
      case "5d":
        startDate.setDate(endDate.getDate() - 5)
        break
      case "1mo":
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case "6mo":
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      case "3y":
        startDate.setFullYear(endDate.getFullYear() - 3)
        break
    }

    return data.filter((item) => new Date(item.Date) >= startDate)
  }

  function rangeBtnClass(active: boolean) {
    return `px-2 py-1 rounded-full text-sm ${
      active
        ? "bg-primary/10 text-primary dark:bg-secondary/70 dark:text-primary-foreground font-semibold"
        : "bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary dark:bg-card dark:text-muted-foreground dark:hover:bg-secondary/70 dark:hover:text-primary-foreground"
    }`
  }

  // Update the chart colors and styles for better dark mode visibility
  function getCustomTicks() {
    if (!formattedData.length) return []

    // For option "Semua", only show years
    if (selectedRange === "all") {
      const years = new Set<number>()
      const yearTicks: string[] = []

      formattedData.forEach((item) => {
        const year = new Date(item.Date).getFullYear()
        years.add(year)
      })

      Array.from(years)
        .sort()
        .forEach((year) => {
          const firstDateInYear = formattedData.find((item) => new Date(item.Date).getFullYear() === year)
          if (firstDateInYear) {
            yearTicks.push(firstDateInYear.Date)
          }
        })

      return yearTicks
    }

    // For option "3 Tahun", show 4 months per year (Jan, Apr, Jul, Oct)
    if (selectedRange === "3y") {
      const quarterTicks: string[] = []
      const targetMonths = [0, 3, 6, 9] // Jan, Apr, Jul, Oct (0-based)
      const years = new Set<number>()

      formattedData.forEach((item) => {
        const year = new Date(item.Date).getFullYear()
        years.add(year)
      })

      Array.from(years)
        .sort()
        .forEach((year) => {
          targetMonths.forEach((month) => {
            const targetDate = new Date(year, month, 1)

            let closestItem = formattedData[0]
            let closestDiff = Number.POSITIVE_INFINITY

            formattedData.forEach((item) => {
              const itemDate = new Date(item.Date)
              if (itemDate.getFullYear() === year) {
                const diff = Math.abs(itemDate.getTime() - targetDate.getTime())
                if (diff < closestDiff) {
                  closestDiff = diff
                  closestItem = item
                }
              }
            })

            const itemDate = new Date(closestItem.Date)
            const diff = Math.abs(itemDate.getTime() - targetDate.getTime())
            if (diff < 45 * 24 * 60 * 60 * 1000) {
              quarterTicks.push(closestItem.Date)
            }
          })
        })

      return quarterTicks
    }

    // For option "6 Bulan" and "1 Tahun", show all months
    if (selectedRange === "6mo" || selectedRange === "1y") {
      const monthTicks: string[] = []
      let currentMonth = -1
      let currentYear = -1

      formattedData.forEach((item) => {
        const date = new Date(item.Date)
        const month = date.getMonth()
        const year = date.getFullYear()

        if (month !== currentMonth || year !== currentYear) {
          monthTicks.push(item.Date)
          currentMonth = month
          currentYear = year
        }
      })

      return monthTicks
    }

    // For option "5 Hari" and "1 Bulan", show all days
    return formattedData.map((item) => item.Date)
  }

  const customTicks = getCustomTicks()

  return (
    <div className="h-full w-full">
      <div className="flex flex-col gap-3 mb-4 ml-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedRange("5d")} className={rangeBtnClass(selectedRange === "5d")}>
            5 Hari
          </button>
          <button onClick={() => setSelectedRange("1mo")} className={rangeBtnClass(selectedRange === "1mo")}>
            1 Bulan
          </button>
          <button onClick={() => setSelectedRange("6mo")} className={rangeBtnClass(selectedRange === "6mo")}>
            6 Bulan
          </button>
          <button onClick={() => setSelectedRange("1y")} className={rangeBtnClass(selectedRange === "1y")}>
            1 Tahun
          </button>
          <button onClick={() => setSelectedRange("3y")} className={rangeBtnClass(selectedRange === "3y")}>
            3 Tahun
          </button>
          <button onClick={() => setSelectedRange("all")} className={rangeBtnClass(selectedRange === "all")}>
            Semua
          </button>
        </div>
      </div>
      <div className="flex gap-4 flex-wrap mb-4 ml-4">
        <button
          onClick={() => handleLegendClick("Open")}
          className={`px-3 py-1 rounded-full text-sm ${
            activeDataKey === "Open"
              ? "bg-blue-200 text-blue-700 font-medium"
              : "bg-background text-muted-foreground hover:bg-blue-200 hover:text-blue-700 dark:bg-card dark:text-muted-foreground dark:hover:bg-blue-200 dark:hover:text-blue-700"
          }`}
        >
          Open
        </button>
        <button
          onClick={() => handleLegendClick("Close")}
          className={`px-3 py-1 rounded-full text-sm ${
            activeDataKey === "Close"
              ? "bg-purple-200 text-purple-700 font-medium"
              : "bg-background text-muted-foreground hover:bg-purple-200 hover:text-purple-700 dark:bg-card dark:text-muted-foreground dark:hover:bg-purple-200 dark:hover:text-purple-700"
          }`}
        >
          Close
        </button>
        <button
          onClick={() => handleLegendClick("High")}
          className={`px-3 py-1 rounded-full text-sm ${
            activeDataKey === "High"
              ? "bg-green-200 text-green-700 font-medium"
              : "bg-background text-muted-foreground hover:bg-green-200 hover:text-green-700 dark:bg-card dark:text-muted-foreground dark:hover:bg-green-200 dark:hover:text-green-700"
          }`}
        >
          High
        </button>
        <button
          onClick={() => handleLegendClick("Low")}
          className={`px-3 py-1 rounded-full text-sm ${
            activeDataKey === "Low"
              ? "bg-red-200 text-red-700 font-medium"
              : "bg-background text-muted-foreground hover:bg-red-200 hover:text-red-700 dark:bg-card dark:text-muted-foreground dark:hover:bg-red-200 dark:hover:text-red-700"
          }`}
        >
          Low
        </button>
      </div>

      <div className="h-[350px]">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{
                top: 5,
                right: 5,
                left: 0, // Reduced from 20 to 10 to minimize left margin
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="Date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: string) => {
                  const date = new Date(value)
                  const year = date.getFullYear()
                  const month = date.getMonth()
                  const day = date.getDate()
                  const monthNames = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "Mei",
                    "Jun",
                    "Jul",
                    "Agu",
                    "Sep",
                    "Okt",
                    "Nov",
                    "Des",
                  ]

                  if (selectedRange === "all") {
                    return `${year}`
                  }
                  if (selectedRange === "3y") {
                    return `${monthNames[month]}/${year}`
                  }
                  if (selectedRange === "1y" || selectedRange === "6mo") {
                    return `${monthNames[month]}/${year}`
                  }
                  return `${day}/${monthNames[month]}/${year.toString().slice(-2)}`
                }}
                ticks={customTicks}
                axisLine={{ stroke: "#e0e0e" }}
                padding={{ left: 10, right: 10 }}
                height={50}
                angle={selectedRange === "5d" || selectedRange === "1mo" ? -45 : 0}
                textAnchor={selectedRange === "5d" || selectedRange === "1mo" ? "end" : "middle"}
              />
              <YAxis
                domain={[minValue, maxValue]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${Math.round(value).toLocaleString("id-ID")}`}
                width={60} // Reduced from 80 to 60 to minimize left space
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconSize={20}
                wrapperStyle={{
                  paddingTop: 5,
                  paddingBottom: 5,
                  lineHeight: "24px",
                  fontSize: "14px",
                }}
              />
              {activeDataKey === "Open" && (
                <Line
                  type="monotone"
                  dataKey="Open"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="Open"
                />
              )}
              {activeDataKey === "Close" && (
                <Line
                  type="monotone"
                  dataKey="Close"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="Close"
                />
              )}
              {activeDataKey === "High" && (
                <Line
                  type="monotone"
                  dataKey="High"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="High"
                />
              )}
              {activeDataKey === "Low" && (
                <Line
                  type="monotone"
                  dataKey="Low"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="Low"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Tidak ada data untuk ditampilkan
          </div>
        )}
      </div>
    </div>
  )
}