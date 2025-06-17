"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ArrowLeft } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Mock data for news articles
const newsArticles = [
  {
    id: "1",
    title: "Bank Indonesia Pertahankan Suku Bunga Acuan di Level 5,75%",
    source: "CNBC Indonesia",
    author: "Herry Prasetyo",
    time: "2 jam yang lalu",
    date: "11 Mei 2025",
    tags: ["BBRI", "BBCA", "BMRI"],
    snippet:
      "Bank Indonesia (BI) memutuskan untuk mempertahankan suku bunga acuan atau BI Rate di level 5,75% dalam Rapat Dewan Gubernur (RDG) bulanan. Keputusan ini sejalan dengan upaya menjaga stabilitas nilai tukar rupiah dan mengendalikan inflasi.",
  },
  {
    id: "2",
    title: "Telkom Indonesia Luncurkan Layanan 5G di 10 Kota Besar",
    source: "Investor Daily",
    author: "Dian Ayu Lestari",
    time: "4 jam yang lalu",
    date: "11 Mei 2025",
    tags: ["TLKM"],
    snippet:
      "PT Telkom Indonesia Tbk (TLKM) resmi meluncurkan layanan 5G di 10 kota besar di Indonesia. Langkah ini merupakan bagian dari strategi perseroan untuk memperkuat posisinya di industri telekomunikasi dan digital.",
  },
  {
    id: "3",
    title: "Astra International Catat Pertumbuhan Laba 15% di Kuartal II-2023",
    source: "Bisnis.com",
    author: "Budi Santoso",
    time: "6 jam yang lalu",
    date: "11 Mei 2025",
    tags: ["ASII"],
    snippet:
      "PT Astra International Tbk (ASII) mencatatkan pertumbuhan laba bersih sebesar 15% secara year-on-year (yoy) pada kuartal II-2023. Kinerja positif ini didorong oleh kontribusi dari segmen otomotif dan jasa keuangan.",
  },
  {
    id: "4",
    title: "BRI Agro Merger dengan BRI, Saham AGRO Melesat",
    source: "Kontan",
    author: "Ratna Dewi",
    time: "8 jam yang lalu",
    date: "11 Mei 2025",
    tags: ["BBRI", "AGRO"],
    snippet:
      "Saham PT Bank Rakyat Indonesia Agroniaga Tbk (AGRO) melesat setelah pengumuman rencana merger dengan induk usahanya, PT Bank Rakyat Indonesia Tbk (BBRI). Langkah ini merupakan bagian dari strategi konsolidasi perbankan BUMN.",
  },
  {
    id: "5",
    title: "Unilever Indonesia Fokus Ekspansi Produk Ramah Lingkungan",
    source: "Kompas",
    author: "Anita Wijaya",
    time: "10 jam yang lalu",
    date: "11 Mei 2025",
    tags: ["UNVR"],
    snippet:
      "PT Unilever Indonesia Tbk (UNVR) mengumumkan fokus strategis pada pengembangan dan ekspansi produk ramah lingkungan. Perseroan menargetkan 50% dari portofolio produknya menggunakan bahan yang dapat didaur ulang pada tahun 2025.",
  },
  {
    id: "6",
    title: "Indeks Harga Saham Gabungan Ditutup Menguat 0,8%",
    source: "Antara News",
    author: "Fajar Nugroho",
    time: "12 jam yang lalu",
    date: "11 Mei 2025",
    tags: ["IHSG", "COMPOSITE"],
    snippet:
      "Indeks Harga Saham Gabungan (IHSG) ditutup menguat 0,8% ke level 7.250 pada perdagangan Kamis (11/5/2025). Penguatan ini didorong oleh aksi beli investor asing di saham-saham perbankan dan telekomunikasi.",
  },
  {
    id: "7",
    title: "Bank Mandiri Targetkan Pertumbuhan Kredit 10-12% Tahun Ini",
    source: "Detik Finance",
    author: "Rini Kusuma",
    time: "14 jam yang lalu",
    date: "11 Mei 2025",
    tags: ["BMRI"],
    snippet:
      "PT Bank Mandiri Tbk (BMRI) menargetkan pertumbuhan kredit sebesar 10-12% pada tahun 2025. Target ini didukung oleh pemulihan ekonomi dan ekspansi di segmen korporasi dan UMKM.",
  },
  {
    id: "8",
    title: "Pertamina Energi Geothermal Siap Melantai di Bursa",
    source: "Tempo",
    author: "Arif Wicaksono",
    time: "16 jam yang lalu",
    date: "11 Mei 2025",
    tags: ["PEGS"],
    snippet:
      "PT Pertamina Energi Geothermal (PEGS) siap melantai di Bursa Efek Indonesia (BEI) pada Juni 2025. Perusahaan menargetkan dana IPO sebesar Rp8 triliun untuk ekspansi kapasitas pembangkit listrik panas bumi.",
  },
]

export default function NewsListingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Helper functions for title processing
  const cleanTitle = (title: string) => {
    return title.endsWith('.') ? title.slice(0, -1) : title
  }
  const createSlugFromTitle = (title: string) => {
    return cleanTitle(title)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .trim()
  }

  // Get all unique tags
  const allTags = Array.from(new Set(newsArticles.flatMap((article) => article.tags))).sort()

  // Filter articles based on search term and selected tag
  const filteredArticles = newsArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.snippet.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTag = selectedTag ? article.tags.includes(selectedTag) : true

    return matchesSearch && matchesTag
  })

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Berita Pasar Saham</h1>
        <p className="text-muted-foreground">Berita dan analisis terbaru dari pasar saham Indonesia</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berita..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={selectedTag === null ? "default" : "outline"} size="sm" onClick={() => setSelectedTag(null)}>
            Semua
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="overflow-hidden h-full flex flex-col">            <CardHeader className="p-4">
              <CardTitle className="text-lg">
                <Link href={`/berita/${createSlugFromTitle(article.title)}`} className="hover:text-primary transition-colors">
                  {cleanTitle(article.title)}
                </Link>
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>{article.source}</span>
                <span>{article.time}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 flex-1">{article.snippet}</p>
              <div className="flex flex-wrap gap-1 mt-auto">
                {article.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 hover:bg-primary/20"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Tidak ada berita yang ditemukan</h3>
          <p className="text-muted-foreground">Coba ubah kata kunci pencarian atau filter yang Anda gunakan</p>
        </div>
      )}
    </div>
  )
}
