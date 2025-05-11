import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface StockNewsProps {
  fullPage?: boolean
}

export default function StockNews({ fullPage = false }: StockNewsProps) {
  const newsItems = [
    {
      id: "1",
      title: "Bank Indonesia Pertahankan Suku Bunga Acuan di Level 5,75%",
      source: "CNBC Indonesia",
      time: "2 jam yang lalu",
      tags: ["BBRI", "BBCA", "BMRI"],
      snippet:
        "Bank Indonesia (BI) memutuskan untuk mempertahankan suku bunga acuan atau BI Rate di level 5,75% dalam Rapat Dewan Gubernur (RDG) bulanan. Keputusan ini sejalan dengan upaya menjaga stabilitas nilai tukar rupiah dan mengendalikan inflasi.",
    },
    {
      id: "2",
      title: "Telkom Indonesia Luncurkan Layanan 5G di 10 Kota Besar",
      source: "Investor Daily",
      time: "4 jam yang lalu",
      tags: ["TLKM"],
      snippet:
        "PT Telkom Indonesia Tbk (TLKM) resmi meluncurkan layanan 5G di 10 kota besar di Indonesia. Langkah ini merupakan bagian dari strategi perseroan untuk memperkuat posisinya di industri telekomunikasi dan digital.",
    },
    {
      id: "3",
      title: "Astra International Catat Pertumbuhan Laba 15% di Kuartal II-2023",
      source: "Bisnis.com",
      time: "6 jam yang lalu",
      tags: ["ASII"],
      snippet:
        "PT Astra International Tbk (ASII) mencatatkan pertumbuhan laba bersih sebesar 15% secara year-on-year (yoy) pada kuartal II-2023. Kinerja positif ini didorong oleh kontribusi dari segmen otomotif dan jasa keuangan.",
    },
    {
      id: "4",
      title: "BRI Agro Merger dengan BRI, Saham AGRO Melesat",
      source: "Kontan",
      time: "8 jam yang lalu",
      tags: ["BBRI", "AGRO"],
      snippet:
        "Saham PT Bank Rakyat Indonesia Agroniaga Tbk (AGRO) melesat setelah pengumuman rencana merger dengan induk usahanya, PT Bank Rakyat Indonesia Tbk (BBRI). Langkah ini merupakan bagian dari strategi konsolidasi perbankan BUMN.",
    },
    {
      id: "5",
      title: "Unilever Indonesia Fokus Ekspansi Produk Ramah Lingkungan",
      source: "Kompas",
      time: "10 jam yang lalu",
      tags: ["UNVR"],
      snippet:
        "PT Unilever Indonesia Tbk (UNVR) mengumumkan fokus strategis pada pengembangan dan ekspansi produk ramah lingkungan. Perseroan menargetkan 50% dari portofolio produknya menggunakan bahan yang dapat didaur ulang pada tahun 2025.",
    },
  ]

  return (
    <Card className="bg-white/80 dark:bg-card backdrop-blur-sm border-secondary/20 dark:border-border overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/70"></div>
      <CardHeader>
        <CardTitle>Berita Terkini</CardTitle>
        <CardDescription>Berita dan analisis terbaru dari pasar saham Indonesia</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {newsItems.slice(0, fullPage ? undefined : 3).map((news, index) => (
            <div key={index} className="group">
              <div className="space-y-2">
                <Link href={`/berita/${news.id}`} className="block">
                  <h3 className="font-medium hover:text-primary cursor-pointer group-hover:text-primary transition-colors dark:text-foreground">
                    {news.title}
                  </h3>
                </Link>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{news.source}</span>
                  <span className="mx-2">•</span>
                  <span>{news.time}</span>
                </div>
                {fullPage && (
                  <>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">{news.snippet}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {news.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 hover:bg-primary/20"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
                {!fullPage && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {news.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 hover:bg-primary/20"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {index < (fullPage ? newsItems.length - 1 : 2) && (
                <Separator className="mt-4 bg-secondary/30 dark:bg-border/50" />
              )}
            </div>
          ))}
        </div>
        {!fullPage && (
          <Button
            variant="outline"
            className="w-full mt-4 border-secondary/30 dark:border-border hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary hover:border-primary/50"
            asChild
          >
            <Link href="/berita">Lihat Semua Berita</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
