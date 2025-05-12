import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

interface StockFinancialsProps {
  financialData: FinancialData[] | null
}

const formatCurrency = (value: number | string) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return `Rp${numValue.toLocaleString("id-ID")}`
}

export function StockFinancials({ financialData }: StockFinancialsProps) {
  const [selectedYear, setSelectedYear] = useState<string>("")

  if (!financialData || financialData.length === 0) {
    return null
  }

  // Urutkan data dari tahun terbaru ke terlama
  const sortedData = [...financialData].sort((a, b) => 
    new Date(b.EndDate).getTime() - new Date(a.EndDate).getTime()
  )

  // Set tahun terbaru sebagai default
  const defaultYear = sortedData[0].EndDate.split('-')[0]
  const [year, setYear] = useState<string>(defaultYear)

  // Filter data berdasarkan tahun yang dipilih
  const selectedData = sortedData.find(data => data.EndDate.startsWith(year)) || sortedData[0]

  // Daftar tahun yang tersedia
  const availableYears = Array.from(new Set(
    sortedData.map(data => data.EndDate.split('-')[0])
  ))

  const financialMetrics = [
    { label: "Periode Laporan", value: selectedData.EndDate },
    { label: "Nama Perusahaan", value: selectedData.EntityName },
    { label: "Mata Uang", value: selectedData.CurrencyType },
    { label: "Total Aset", value: formatCurrency(selectedData.TotalAssets) },
    { label: "Total Ekuitas", value: formatCurrency(selectedData.TotalEquity) },
    { label: "Laba Bersih", value: formatCurrency(selectedData.NetProfit) },
    { label: "Laba Operasi", value: formatCurrency(selectedData.OperatingProfit) },
    { label: "Arus Kas Operasi", value: formatCurrency(selectedData.CashFromOperating) },
    { label: "Arus Kas Investasi", value: formatCurrency(selectedData.CashFromInvesting) },
    { label: "Arus Kas Pendanaan", value: formatCurrency(selectedData.CashFromFinancing) }
  ]

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 card-hover">
      <CardHeader>
        <div className="flex justify-between items-start">
        <div>
            <CardTitle className="mb-2">Data Keuangan</CardTitle>
            <CardDescription>
                Laporan keuangan {selectedData.EntityName}
            </CardDescription>
        </div>

          <Select 
            value={year}
            onValueChange={(value) => setYear(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Metrik</TableHead>
              <TableHead className="text-right">Nilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financialMetrics.map((metric) => (
              <TableRow key={metric.label}>
                <TableCell className="font-medium">{metric.label}</TableCell>
                <TableCell className="text-right">{metric.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}