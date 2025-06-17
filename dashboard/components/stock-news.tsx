"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface NewsItem {
  _id: {
    $oid: string
  }
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

interface ApiResponse {
  count: number
  data: NewsItem[]
}

interface StockNewsProps {
  fullPage?: boolean
  onShowAllNews?: () => void
}

export default function StockNews({ fullPage = false, onShowAllNews }: StockNewsProps) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Fix hydration by detecting client-side
  useEffect(() => {
    setIsClient(true)
  }, [])
  const fetchNews = async () => {
    try {
      setLoading(true)
      setIsUsingFallback(false)
      
      console.log('🔄 Attempting to fetch news from API...')
      
      // Simple fetch without timeout first to test connectivity
      try {
        const response = await fetch('http://localhost:5000/api/iqplus/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        })
        
        console.log('📡 Response status:', response.status)
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
        }
        
        const data: ApiResponse = await response.json()
        console.log('📊 Data received:', { count: data.count, dataLength: data.data?.length })
        
        // Check if data exists and has the expected structure
        if (data && data.data && Array.isArray(data.data)) {
          setNewsItems(data.data)
          setError(null)
          setIsUsingFallback(false)
          console.log('✅ Successfully loaded news from API')
        } else {
          throw new Error('Invalid data format received from API')
        }
        
      } catch (fetchError) {
        console.error('❌ Fetch error:', fetchError)
        throw fetchError
      }
      
    } catch (err) {
      console.error('❌ Error fetching news:', err)
      
      // Handle specific error types without breaking
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          setError('Koneksi timeout. Menggunakan data demo.')
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('❌ Tidak dapat terhubung ke server. Pastikan API server berjalan di http://localhost:5000')
        } else if (err.message.includes('ERR_CONNECTION_REFUSED')) {
          setError('🔌 Server tidak dapat dijangkau. Periksa apakah API server berjalan.')
        } else {
          setError(`⚠️ Error: ${err.message}`)
        }
      } else {
        setError('❓ Terjadi kesalahan yang tidak diketahui.')
      }
        // Use fallback dummy data for development
      console.log('🔄 Using fallback data...')
      setNewsItems(getFallbackData())
      setIsUsingFallback(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const initFetch = async () => {
      if (isMounted) {
        await fetchNews()
      }
    }
    
    initFetch()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])

  // Fallback dummy data for development/testing
  const getFallbackData = (): NewsItem[] => [
    {
      _id: { $oid: "fallback1" },
      category: "stock",
      date: "16/06/2025 10:00",
      emiten: "BBRI",
      processed: true,
      publisher: "demo",
      sentimen: "positif" as const,
      summary: "Contoh berita fallback untuk development. API server belum tersedia.",
      text: "Ini adalah data fallback untuk development ketika API tidak tersedia.",
      title: "Data Demo - API Tidak Tersedia",
      url: "#"
    },
    {
      _id: { $oid: "fallback2" },
      category: "stock", 
      date: "16/06/2025 09:30",
      emiten: "TLKM",
      processed: true,
      publisher: "demo",
      sentimen: "netral" as const,
      summary: "Berita demo kedua untuk testing komponen ketika API belum ready.",
      text: "Data fallback kedua untuk development.",
      title: "Demo Berita Kedua - Development Mode", 
      url: "#"
    },
    {
      _id: { $oid: "fallback3" },
      category: "stock",
      date: "16/06/2025 09:00", 
      emiten: "BBCA",
      processed: true,
      publisher: "demo",
      sentimen: "negatif" as const,
      summary: "Berita demo ketiga dengan sentimen negatif untuk testing tampilan.",
      text: "Data fallback ketiga untuk development.",
      title: "Demo Berita Ketiga - Testing Sentimen",
      url: "#"    }
  ]
  useEffect(() => {
    let isMounted = true
    
    const initFetch = async () => {
      if (isMounted) {
        await fetchNews()
      }
    }
    
    initFetch()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [])  // Helper function to format date (static to avoid hydration issues)
  const formatDate = (dateString: string) => {
    // Use static relative time to avoid hydration mismatch
    try {
      // For demo/fallback data, return static values
      if (dateString === "16/06/2025 10:00") return "2 jam yang lalu"
      if (dateString === "16/06/2025 09:30") return "2 jam yang lalu" 
      if (dateString === "16/06/2025 09:00") return "3 jam yang lalu"
      
      // For real API data, parse and calculate
      const [datePart, timePart] = dateString.split(' ')
      if (!datePart || !timePart) return dateString
      
      const [day, month, year] = datePart.split('/')
      if (!day || !month || !year) return dateString
      
      // Create date object
      const newsDate = new Date(`${year}-${month}-${day}T${timePart}:00`)
      if (isNaN(newsDate.getTime())) return dateString
      
      // Use client-side time only after hydration to avoid mismatch
      const now = isClient ? new Date() : new Date('2025-06-17T12:00:00')
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

  // Helper function to clean title (remove trailing period)
  const cleanTitle = (title: string) => {
    return title.endsWith('.') ? title.slice(0, -1) : title
  }

  if (loading) {
    return (
      <Card className={`bg-white/80 dark:bg-card backdrop-blur-sm border-secondary/20 dark:border-border overflow-hidden ${
        fullPage ? "h-full" : ""
      }`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/70"></div>
        <CardHeader>
          <CardTitle>{fullPage ? "Semua Berita Terkini" : "Berita Terkini"}</CardTitle>
          <CardDescription>Memuat berita...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-white/80 dark:bg-card backdrop-blur-sm border-secondary/20 dark:border-border overflow-hidden ${
        fullPage ? "h-full" : ""
      }`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/70"></div>
        <CardHeader>
          <CardTitle>{fullPage ? "Semua Berita Terkini" : "Berita Terkini"}</CardTitle>
          <CardDescription>Terjadi kesalahan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>            <Button 
              variant="outline" 
              className="mt-4"
              onClick={fetchNews}
              disabled={loading}
            >
              {loading ? 'Mencoba...' : 'Coba Lagi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className={`bg-white/80 dark:bg-card backdrop-blur-sm border-secondary/20 dark:border-border overflow-hidden ${
      fullPage ? "h-full" : ""
    }`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/70"></div>        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{fullPage ? "Semua Berita Terkini" : "Berita Terkini"}</CardTitle>
              <CardDescription>
                {fullPage 
                  ? "Daftar lengkap berita dan analisis pasar saham Indonesia" 
                  : "Berita dan analisis terbaru dari pasar saham Indonesia"
                }
                {isUsingFallback && (
                  <span className="block text-orange-600 dark:text-orange-400 text-xs mt-1">
                    📡 Menggunakan data demo - API tidak tersedia
                  </span>
                )}
              </CardDescription>
            </div>
            {(error || isUsingFallback) && !loading && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNews}
                className="ml-2"
              >
                🔄 Refresh
              </Button>
            )}
          </div>        </CardHeader>
      <CardContent>
        {isUsingFallback && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-sm text-orange-800 dark:text-orange-300">
                <div className="flex items-center">
                  <span className="mr-2">📡</span>
                  Menggunakan data demo - API tidak tersedia
                </div>
                {error && (
                  <div className="mt-2 text-xs text-orange-700 dark:text-orange-400">
                    <strong>Error:</strong> {error}
                  </div>
                )}
                <div className="mt-2 text-xs text-orange-600 dark:text-orange-500">
                  💡 <strong>Troubleshooting:</strong>
                  <br />
                  1. Pastikan API server berjalan di <code className="px-1 bg-orange-200 dark:bg-orange-800 rounded">http://localhost:5000</code>
                  <br />
                  2. Cek console browser untuk detail error
                  <br />
                  3. Test manual: buka <code className="px-1 bg-orange-200 dark:bg-orange-800 rounded">http://localhost:5000/api/iqplus/</code> di browser
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNews}
                disabled={loading}
                className="ml-2 h-8"
              >
                {loading ? '...' : '🔄 Test'}
              </Button>
            </div>
          </div>
        )}
        
        {fullPage ? (
          // Grid layout for full page
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {newsItems.map((news) => (
              <Card key={news._id.$oid} className="overflow-hidden h-full flex flex-col bg-background/50 dark:bg-card/50 border-secondary/30 dark:border-border/50 hover:shadow-md transition-shadow">
                <CardHeader className="p-4">                  <CardTitle className="text-base leading-tight">
                    <Link href={`/berita/${news._id.$oid}`} className="hover:text-primary transition-colors">
                      {cleanTitle(news.title)}
                    </Link>
                  </CardTitle><CardDescription className="flex items-center justify-between text-xs">
                    <span className="capitalize">{news.publisher}</span>
                    <span suppressHydrationWarning>{formatDate(news.date)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{news.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 hover:bg-primary/20"
                    >
                      {news.emiten}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getSentimentColor(news.sentimen)}
                    >
                      {news.sentimen}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List layout for preview mode
          <div className="space-y-4">
            {newsItems.slice(0, 3).map((news, index) => (
              <div key={index} className="group">
                <div className="space-y-2">                  <Link href={`/berita/${news._id.$oid}`} className="block">
                    <h3 className="font-medium hover:text-primary cursor-pointer group-hover:text-primary transition-colors dark:text-foreground">
                      {cleanTitle(news.title)}
                    </h3>
                  </Link><div className="flex items-center text-sm text-muted-foreground">
                    <span className="capitalize">{news.publisher}</span>
                    <span className="mx-2">•</span>
                    <span suppressHydrationWarning>{formatDate(news.date)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 hover:bg-primary/20"
                    >
                      {news.emiten}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getSentimentColor(news.sentimen)}
                    >
                      {news.sentimen}
                    </Badge>
                  </div>
                </div>
                {index < 2 && <Separator className="mt-4 bg-secondary/30 dark:bg-border/50" />}
              </div>
            ))}
          </div>        )}        {!fullPage && newsItems.length > 0 && (
          <Button
            variant="outline"
            className="w-full mt-4 border-secondary/30 dark:border-border hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary hover:border-primary/50"
            onClick={onShowAllNews}
          >
            Lihat Semua Berita
          </Button>
        )}
        {newsItems.length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Tidak ada berita tersedia saat ini.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
