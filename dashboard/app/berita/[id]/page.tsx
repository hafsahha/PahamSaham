"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, Clock, Globe, Tag } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// Interface for API response
interface ApiResponse {
  count: number
  data: NewsItem[]
}

interface NewsItem {
  _id: { $oid: string }
  category: string
  date: string
  emiten: string
  processed: boolean
  publisher: string
  sentimen: "positif" | "negatif" | "netral"
  summary: string
  text: string
  title: string
  url: string
}

// Fallback data for development/testing (same structure as API data)
const getFallbackData = (): NewsItem[] => [
  {
    _id: { $oid: "fallback1" },
    category: "stock",
    date: "16/06/2025 10:00",
    emiten: "BBRI",
    processed: true,
    publisher: "CNBC Indonesia",
    sentimen: "positif" as const,
    summary: "Bank Indonesia (BI) memutuskan untuk mempertahankan suku bunga acuan atau BI Rate di level 5,75% dalam Rapat Dewan Gubernur (RDG) bulanan. Keputusan ini sejalan dengan upaya menjaga stabilitas nilai tukar rupiah dan mengendalikan inflasi.",
    text: "JAKARTA - Bank Indonesia (BI) memutuskan untuk mempertahankan suku bunga acuan atau BI Rate di level 5,75% dalam Rapat Dewan Gubernur (RDG) bulanan yang digelar pada 10-11 Mei 2025. Keputusan ini sejalan dengan upaya menjaga stabilitas nilai tukar rupiah dan mengendalikan inflasi.\n\nGubernur BI, Perry Warjiyo, dalam konferensi pers virtual pada Kamis (11/5/2025) mengatakan keputusan tersebut konsisten dengan kebijakan moneter yang pre-emptive dan forward looking untuk memastikan inflasi tetap terkendali dalam sasaran 3,0±1% pada 2025 dan 2026.\n\n'Keputusan ini juga sejalan dengan langkah stabilisasi nilai tukar rupiah dari dampak ketidakpastian pasar keuangan global yang masih tinggi,' ujar Perry.\n\nMenurut Perry, BI terus memperkuat koordinasi dengan Pemerintah dan otoritas terkait untuk menjaga stabilitas makroekonomi dan sistem keuangan guna mendukung pemulihan ekonomi lebih lanjut.",
    title: "Bank Indonesia Pertahankan Suku Bunga Acuan di Level 5,75%",
    url: "#"
  },
  {
    _id: { $oid: "fallback2" },
    category: "stock", 
    date: "16/06/2025 09:30",
    emiten: "TLKM",
    processed: true,
    publisher: "Investor Daily",
    sentimen: "positif" as const,
    summary: "PT Telkom Indonesia Tbk (TLKM) resmi meluncurkan layanan 5G di 10 kota besar di Indonesia. Langkah ini merupakan bagian dari strategi perseroan untuk memperkuat posisinya di industri telekomunikasi dan digital.",
    text: "PT Telkom Indonesia Tbk (TLKM) resmi meluncurkan layanan 5G di 10 kota besar di Indonesia. Langkah ini merupakan bagian dari strategi perseroan untuk memperkuat posisinya di industri telekomunikasi dan digital.\n\nDirektur Utama Telkom Indonesia, Ririek Adriansyah, mengatakan bahwa peluncuran layanan 5G ini merupakan komitmen perseroan untuk mendukung transformasi digital Indonesia.\n\n'Kami berkomitmen untuk terus mengembangkan infrastruktur telekomunikasi yang modern dan handal untuk mendukung kebutuhan masyarakat Indonesia,' kata Ririek.\n\nLayanan 5G Telkom akan diluncurkan di Jakarta, Surabaya, Bandung, Medan, Semarang, Makassar, Denpasar, Balikpapan, Palembang, dan Manado.",
    title: "Telkom Indonesia Luncurkan Layanan 5G di 10 Kota Besar", 
    url: "#"
  },
  {
    _id: { $oid: "fallback3" },
    category: "stock",
    date: "16/06/2025 09:00",
    emiten: "ASII",
    processed: true,
    publisher: "Bisnis.com",
    sentimen: "positif" as const,
    summary: "PT Astra International Tbk (ASII) mencatatkan pertumbuhan laba bersih sebesar 15% secara year-on-year (yoy) pada kuartal II-2023. Kinerja positif ini didorong oleh kontribusi dari segmen otomotif dan jasa keuangan.",
    text: "PT Astra International Tbk (ASII) mencatatkan pertumbuhan laba bersih sebesar 15% secara year-on-year (yoy) pada kuartal II-2023. Kinerja positif ini didorong oleh kontribusi dari segmen otomotif dan jasa keuangan.\n\nPresiden Direktur Astra International, Djony Bunarto Tjondro, mengatakan bahwa kinerja positif ini didorong oleh kontribusi dari segmen otomotif dan jasa keuangan yang tumbuh signifikan.\n\n'Segmen otomotif kami mencatat pertumbuhan penjualan yang kuat, didukung oleh peluncuran model-model baru dan pemulihan daya beli konsumen,' ujar Djony.\n\nSementara itu, segmen jasa keuangan juga menunjukkan kinerja yang solid dengan pertumbuhan kredit yang sehat.",
    title: "Astra International Catat Pertumbuhan Laba 15% di Kuartal II-2023",
    url: "#"
  }
]

export default function NewsDetailPage() {
  const params = useParams()
  const [newsArticle, setNewsArticle] = useState<NewsItem | null>(null)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch news from API
  const fetchNews = async () => {
    console.log('🔄 Fetching news from API...')
    try {
      const response = await fetch('http://localhost:5000/api/iqplus/', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      
      if (data && data.data && Array.isArray(data.data)) {
        console.log('✅ API data loaded:', data.data.length, 'articles')
        setNewsItems(data.data)
        setError(null)
        return data.data
      } else {
        throw new Error('Invalid data format received from API')
      }
    } catch (err) {
      console.error('❌ Error fetching news:', err)
      console.log('🔄 Using fallback data...')
      const fallbackData = getFallbackData()
      setNewsItems(fallbackData)
      return fallbackData
    }
  }

  // Helper functions to handle title-based URLs
  const cleanTitle = (title: string) => {
    return title.endsWith('.') ? title.slice(0, -1) : title
  }

  const createSlugFromTitle = (title: string) => {
    const cleaned = cleanTitle(title)
    const result = cleaned
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .trim()
    
    return result
  }

  const findArticleBySlug = (slug: string, articles: NewsItem[]) => {
    console.log('🔍 Looking for slug:', slug)
    
    const foundArticle = articles.find((article) => {
      const articleSlug = createSlugFromTitle(article.title)
      const matches = articleSlug === slug
      console.log(`📰 "${article.title}" → "${articleSlug}" | Match: ${matches}`)
      return matches
    })
    
    console.log('🎯 Found article:', foundArticle ? foundArticle.title : 'Not found')
    return foundArticle
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const [datePart, timePart] = dateString.split(' ')
      if (!datePart || !timePart) return dateString
      
      const [day, month, year] = datePart.split('/')
      if (!day || !month || !year) return dateString
      
      const newsDate = new Date(`${year}-${month}-${day}T${timePart}:00`)
      if (isNaN(newsDate.getTime())) return dateString
      
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - newsDate.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) {
        return 'Baru saja'
      } else if (diffInHours < 24) {
        return `${diffInHours} jam yang lalu`
      } else {
        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays} hari yang lalu`
      }
    } catch (error) {
      return dateString
    }
  }

  // Helper function to get sentiment badge color
  const getSentimentColor = (sentimen: string) => {
    switch (sentimen) {
      case 'positif':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300'
      case 'negatif':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300'
    }
  }

  useEffect(() => {
    const fetchNewsArticle = async () => {
      setIsLoading(true)
      
      // Fetch news data from API
      const articles = await fetchNews()
      
      // Try to find article by slug
      const searchId = Array.isArray(params.id) ? params.id[0] : params.id
      console.log('🔍 Searching for article with searchId:', searchId)
      
      const article = findArticleBySlug(searchId as string, articles)
      setNewsArticle(article || null)

      setIsLoading(false)
    }

    fetchNewsArticle()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (!newsArticle) {
    return (      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Dashboard
            </Link>
          </Button>
        </div>
        <Card className="text-center py-12">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">Artikel tidak ditemukan</h1>
            <p className="text-muted-foreground mb-6">
              Maaf, artikel yang Anda cari tidak ditemukan atau telah dihapus.
            </p>            <Button asChild>
              <Link href="/">Kembali ke Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>

      <article className="space-y-6">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            {cleanTitle(newsArticle.title)}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="capitalize">{newsArticle.publisher}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatDate(newsArticle.date)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge
              variant="outline"
              className={getSentimentColor(newsArticle.sentimen)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {newsArticle.sentimen}
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-300">
              {newsArticle.emiten}
            </Badge>
          </div>
        </header>

        <Separator />

        <div className="prose prose-lg max-w-none dark:prose-invert">
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            {newsArticle.summary}
          </p>
          
          <div className="whitespace-pre-line leading-relaxed">
            {newsArticle.text}
          </div>
        </div>

        <Separator />

        <footer className="text-sm text-muted-foreground">
          <p>Sumber: {newsArticle.publisher}</p>
          <p>Kategori: {newsArticle.category}</p>
        </footer>
      </article>
    </div>
  )
}