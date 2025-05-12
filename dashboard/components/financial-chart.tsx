"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

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

  

interface FinancialChartCardProps {
  financialData: FinancialData[]
}

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000000000) {
    return `Rp${(value / 1000000000000).toFixed(1)}T`
  }
  if (value >= 1000000000) {
    return `Rp${(value / 1000000000).toFixed(1)}M`
  }
  return `Rp${value}`
}

export function FinancialChartCard({ financialData }: FinancialChartCardProps) {
  if (!financialData || financialData.length === 0) {
    return null
  }

  // Format data untuk chart
  const chartData = financialData.map(data => ({
    year: new Date(data.EndDate).getFullYear(),
    netProfit: parseFloat(data.NetProfit),
    totalAssets: parseFloat(data.TotalAssets),
    operatingProfit: parseFloat(data.OperatingProfit),
    cashFromOperating: parseFloat(data.CashFromOperating)
  })).reverse() // Urutkan dari tahun terlama ke terbaru

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
      <CardHeader>
        <CardTitle>Trend Keuangan</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <div className="flex flex-col gap-8 h-full">
          {/* Grafik Line untuk Profit */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-center mb-2">Profit (Rp Triliun)</h3>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={chartData}
                margin={{ top: 20, right: 30, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year"  dy={10} />
                <YAxis tickFormatter={(value) => formatCurrencyShort(value)} />
                <Tooltip formatter={(value) => formatCurrencyShort(Number(value))} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="netProfit" 
                  name="Laba Bersih" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="operatingProfit" 
                  name="Laba Operasi" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Grafik Bar untuk Aset dan Kas */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-center mb-2">Aset & Kas Operasi (Rp Triliun)</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => formatCurrencyShort(value)} />
                <Tooltip formatter={(value) => formatCurrencyShort(Number(value))} />
                <Legend />
                <Bar 
                  dataKey="totalAssets" 
                  name="Total Aset" 
                  fill="#8884d8" 
                />
                <Bar 
                  dataKey="cashFromOperating" 
                  name="Kas Operasi" 
                  fill="#82ca9d" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}