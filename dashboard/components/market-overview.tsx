"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MarketOverview() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-secondary/20 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/70"></div>
      <CardHeader>
        <CardTitle>Ringkasan Pasar</CardTitle>
        <CardDescription>Performa indeks utama dan sektor</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="indices">
          <TabsList className="mb-4 bg-secondary/20">
            <TabsTrigger value="indices" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Indeks
            </TabsTrigger>
            <TabsTrigger value="sectors" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Sektor
            </TabsTrigger>
            <TabsTrigger value="commodities" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Komoditas
            </TabsTrigger>
            <TabsTrigger value="forex" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Forex
            </TabsTrigger>
          </TabsList>
          <TabsContent value="indices">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MarketTile name="IHSG" value="7.234,56" change="+1,2%" isPositive={true} />
              <MarketTile name="LQ45" value="982,45" change="+0,8%" isPositive={true} />
              <MarketTile name="JII" value="567,23" change="-0,3%" isPositive={false} />
              <MarketTile name="IDX80" value="234,56" change="+0,5%" isPositive={true} />
              <MarketTile name="IDX30" value="567,89" change="-0,3%" isPositive={false} />
              <MarketTile name="IDXBUMN20" value="432,15" change="+1,5%" isPositive={true} />
              <MarketTile name="IDXSMC-LIQ" value="345,67" change="+0,2%" isPositive={true} />
              <MarketTile name="IDXESGL" value="287,65" change="-0,7%" isPositive={false} />
            </div>
          </TabsContent>
          <TabsContent value="sectors">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MarketTile name="Keuangan" value="1.234,56" change="+2,1%" isPositive={true} />
              <MarketTile name="Konsumer" value="876,54" change="+0,9%" isPositive={true} />
              <MarketTile name="Properti" value="432,12" change="-1,2%" isPositive={false} />
              <MarketTile name="Infrastruktur" value="765,43" change="+1,7%" isPositive={true} />
              <MarketTile name="Pertambangan" value="543,21" change="-0,8%" isPositive={false} />
              <MarketTile name="Pertanian" value="321,98" change="+0,4%" isPositive={true} />
              <MarketTile name="Teknologi" value="876,54" change="+3,2%" isPositive={true} />
              <MarketTile name="Kesehatan" value="654,32" change="+1,5%" isPositive={true} />
            </div>
          </TabsContent>
          <TabsContent value="commodities">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MarketTile name="Minyak Mentah" value="$75,43" change="+2,3%" isPositive={true} />
              <MarketTile name="Emas" value="$1.876,54" change="+0,5%" isPositive={true} />
              <MarketTile name="CPO" value="Rp11.450" change="-0,7%" isPositive={false} />
              <MarketTile name="Batubara" value="$98,75" change="+1,2%" isPositive={true} />
            </div>
          </TabsContent>
          <TabsContent value="forex">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MarketTile name="USD/IDR" value="15.432" change="-0,3%" isPositive={false} />
              <MarketTile name="EUR/IDR" value="16.789" change="+0,2%" isPositive={true} />
              <MarketTile name="JPY/IDR" value="107,65" change="-0,5%" isPositive={false} />
              <MarketTile name="SGD/IDR" value="11.432" change="+0,1%" isPositive={true} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface MarketTileProps {
  name: string
  value: string
  change: string
  isPositive: boolean
}

function MarketTile({ name, value, change, isPositive }: MarketTileProps) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-secondary/10 relative overflow-hidden group hover:border-primary/20 transition-colors">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="text-sm font-medium text-primary">{name}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
      <div className={`text-sm mt-1 ${isPositive ? "text-accent" : "text-red-500"}`}>{change}</div>
    </div>
  )
}
