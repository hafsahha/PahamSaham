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
    content: `
      <p>JAKARTA - Bank Indonesia (BI) memutuskan untuk mempertahankan suku bunga acuan atau BI Rate di level 5,75% dalam Rapat Dewan Gubernur (RDG) bulanan yang digelar pada 10-11 Mei 2025. Keputusan ini sejalan dengan upaya menjaga stabilitas nilai tukar rupiah dan mengendalikan inflasi.</p>
      
      <p>Gubernur BI, Perry Warjiyo, dalam konferensi pers virtual pada Kamis (11/5/2025) mengatakan keputusan tersebut konsisten dengan kebijakan moneter yang pre-emptive dan forward looking untuk memastikan inflasi tetap terkendali dalam sasaran 3,0±1% pada 2025 dan 2026.</p>
      
      <p>"Keputusan ini juga sejalan dengan langkah stabilisasi nilai tukar rupiah dari dampak ketidakpastian pasar keuangan global yang masih tinggi," ujar Perry.</p>
      
      <p>Menurut Perry, BI terus memperkuat koordinasi dengan Pemerintah dan otoritas terkait untuk menjaga stabilitas makroekonomi dan sistem keuangan guna mendukung pemulihan ekonomi lebih lanjut.</p>
      
      <h3>Dampak Terhadap Sektor Perbankan</h3>
      
      <p>Keputusan BI untuk mempertahankan suku bunga acuan diprediksi akan berdampak positif bagi saham-saham perbankan seperti BBRI, BBCA, dan BMRI. Analis dari Mandiri Sekuritas, Tjandra Lienandjaja, mengatakan bahwa stabilitas suku bunga akan mendukung pertumbuhan kredit dan menjaga kualitas aset perbankan.</p>
      
      <p>"Dengan suku bunga yang stabil, bank-bank besar seperti BRI, BCA, dan Bank Mandiri dapat mempertahankan margin bunga bersih (NIM) mereka dan terus mengalami pertumbuhan kredit yang sehat," kata Tjandra.</p>
      
      <p>Sementara itu, ekonom dari Bank Central Asia (BCA), David Sumual, memperkirakan bahwa BI akan mulai mempertimbangkan penurunan suku bunga pada kuartal IV-2025, tergantung pada perkembangan inflasi dan stabilitas nilai tukar rupiah.</p>
      
      <h3>Proyeksi Ekonomi</h3>
      
      <p>BI memproyeksikan pertumbuhan ekonomi Indonesia pada 2025 tetap kuat di kisaran 5,1-5,5%. Inflasi diperkirakan tetap terkendali dalam sasaran 3,0±1%.</p>
      
      <p>Dari sisi eksternal, neraca pembayaran Indonesia diprakirakan tetap baik dengan defisit transaksi berjalan sekitar 0,5-1,3% dari PDB pada 2025, yang didukung oleh kinerja ekspor yang tetap kuat meski di tengah moderasi pertumbuhan ekonomi dunia.</p>
    `,
    relatedNews: ["2", "4", "5"],
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
    content: `
      <p>JAKARTA - PT Telkom Indonesia Tbk (TLKM) resmi meluncurkan layanan 5G di 10 kota besar di Indonesia pada Rabu (10/5/2025). Kota-kota tersebut meliputi Jakarta, Surabaya, Bandung, Medan, Makassar, Denpasar, Semarang, Yogyakarta, Palembang, dan Balikpapan.</p>
      
      <p>Direktur Utama Telkom Indonesia, Ririek Adriansyah, dalam acara peluncuran di Jakarta mengatakan bahwa ekspansi layanan 5G ini merupakan bagian dari strategi perseroan untuk memperkuat posisinya di industri telekomunikasi dan digital.</p>
      
      <p>"Kami berkomitmen untuk terus mengembangkan infrastruktur digital yang handal dan terdepan untuk mendukung transformasi digital Indonesia," ujar Ririek.</p>
      
      <p>Menurut Ririek, Telkom Indonesia telah menginvestasikan sekitar Rp15 triliun untuk pengembangan jaringan 5G ini. Investasi tersebut mencakup pembangunan infrastruktur, pengadaan perangkat, dan pengembangan ekosistem digital.</p>
      
      <h3>Potensi Pasar dan Dampak Bisnis</h3>
      
      <p>Direktur Network & IT Solution Telkom Indonesia, Herlan Wijanarko, menjelaskan bahwa layanan 5G Telkom akan menawarkan kecepatan hingga 1 Gbps, latency kurang dari 5 milidetik, dan konektivitas yang lebih stabil.</p>
      
      <p>"Dengan teknologi 5G, kami dapat mendukung berbagai inovasi seperti smart city, Internet of Things (IoT), augmented reality, dan virtual reality yang membutuhkan koneksi internet cepat dan stabil," kata Herlan.</p>
      
      <p>Analis dari Mirae Asset Sekuritas, Reza Priyambada, memperkirakan bahwa peluncuran layanan 5G akan berdampak positif terhadap kinerja saham TLKM dalam jangka menengah hingga panjang.</p>
      
      <p>"Meskipun investasi awal cukup besar, dalam jangka panjang layanan 5G akan menjadi pendorong pertumbuhan pendapatan baru bagi Telkom Indonesia, terutama dari segmen korporasi dan industri," kata Reza.</p>
      
      <h3>Rencana Ekspansi</h3>
      
      <p>Telkom Indonesia berencana untuk memperluas cakupan layanan 5G ke 25 kota di Indonesia pada akhir 2025 dan 50 kota pada 2026. Perseroan juga akan meluncurkan berbagai paket layanan 5G untuk segmen konsumen dan korporasi.</p>
      
      <p>"Kami juga akan berkolaborasi dengan berbagai pihak untuk mengembangkan use case 5G di berbagai sektor seperti manufaktur, kesehatan, pendidikan, dan transportasi," tambah Ririek.</p>
    `,
    relatedNews: ["3", "5"],
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
    content: `
      <p>JAKARTA - PT Astra International Tbk (ASII) mencatatkan pertumbuhan laba bersih sebesar 15% secara year-on-year (yoy) pada kuartal II-2025. Berdasarkan laporan keuangan yang dirilis pada Rabu (10/5/2025), perseroan membukukan laba bersih sebesar Rp8,2 triliun pada kuartal II-2025, naik dari Rp7,1 triliun pada periode yang sama tahun lalu.</p>
      
      <p>Presiden Direktur Astra International, Djony Bunarto Tjondro, mengatakan bahwa kinerja positif ini didorong oleh kontribusi dari segmen otomotif dan jasa keuangan yang tumbuh signifikan.</p>
      
      <p>"Segmen otomotif kami mencatat pertumbuhan penjualan yang kuat, didukung oleh peluncuran model-model baru dan pemulihan daya beli konsumen. Sementara itu, segmen jasa keuangan juga menunjukkan kinerja yang solid dengan pertumbuhan kredit yang sehat," ujar Djony dalam keterangan resminya.</p>
      
      <h3>Kinerja Per Segmen</h3>
      
      <p>Segmen otomotif Astra mencatat pendapatan sebesar Rp35,7 triliun pada kuartal II-2025, naik 18% yoy. Kontribusi laba bersih dari segmen ini mencapai Rp3,5 triliun, naik 22% yoy.</p>
      
      <p>Pada segmen jasa keuangan, Astra membukukan pendapatan sebesar Rp12,3 triliun, naik 12% yoy, dengan kontribusi laba bersih sebesar Rp2,1 triliun, naik 15% yoy.</p>
      
      <p>Segmen alat berat, pertambangan, konstruksi, dan energi mencatat pendapatan sebesar Rp18,5 triliun, naik 8% yoy, dengan kontribusi laba bersih sebesar Rp1,8 triliun, naik 5% yoy.</p>
      
      <p>Sementara itu, segmen agribisnis mencatat pendapatan sebesar Rp7,2 triliun, naik 3% yoy, dengan kontribusi laba bersih sebesar Rp0,5 triliun, naik 2% yoy.</p>
      
      <h3>Prospek Bisnis</h3>
      
      <p>Djony mengatakan bahwa Astra International tetap optimis dengan prospek bisnis di semester II-2025, meskipun tetap waspada terhadap berbagai tantangan global dan domestik.</p>
      
      <p>"Kami akan terus fokus pada strategi diversifikasi usaha dan transformasi digital untuk memperkuat daya saing dan menciptakan nilai jangka panjang bagi seluruh pemangku kepentingan," kata Djony.</p>
      
      <p>Analis dari Bahana Sekuritas, Michael Setjoadi, menilai kinerja Astra International pada kuartal II-2025 melampaui ekspektasi pasar. Ia memperkirakan saham ASII masih memiliki potensi kenaikan hingga akhir tahun.</p>
      
      <p>"Dengan fundamental yang kuat dan diversifikasi usaha yang luas, Astra International berada dalam posisi yang baik untuk memanfaatkan pemulihan ekonomi Indonesia," kata Michael.</p>
    `,
    relatedNews: ["2", "4"],
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
    content: `
      <p>JAKARTA - Saham PT Bank Rakyat Indonesia Agroniaga Tbk (AGRO) melesat setelah pengumuman rencana merger dengan induk usahanya, PT Bank Rakyat Indonesia Tbk (BBRI). Pada perdagangan Kamis (11/5/2025), saham AGRO ditutup menguat 24,8% ke level Rp1.250 per saham.</p>
      
      <p>Direktur Utama BRI, Sunarso, dalam konferensi pers virtual pada Rabu (10/5/2025) mengatakan bahwa rencana merger ini merupakan bagian dari strategi konsolidasi perbankan BUMN untuk meningkatkan efisiensi dan daya saing.</p>
      
      <p>"Merger ini akan memperkuat posisi BRI di segmen agribisnis dan UMKM, sekaligus meningkatkan efisiensi operasional dan permodalan," ujar Sunarso.</p>
      
      <p>Menurut Sunarso, proses merger diharapkan selesai pada kuartal IV-2025, setelah mendapatkan persetujuan dari regulator dan pemegang saham kedua bank.</p>
      
      <h3>Skema Merger</h3>
      
      <p>Direktur Keuangan BRI, Viviana Dyah Ayu, menjelaskan bahwa merger akan dilakukan melalui skema penggabungan usaha, di mana BRI Agro akan dilebur ke dalam BRI.</p>
      
      <p>"Pemegang saham BRI Agro akan mendapatkan saham BRI dengan rasio konversi yang akan ditentukan berdasarkan penilaian independen," kata Viviana.</p>
      
      <p>Viviana menambahkan bahwa BRI telah menunjuk JP Morgan dan Mandiri Sekuritas sebagai penasihat keuangan untuk transaksi ini.</p>
      
      <h3>Dampak Terhadap Industri Perbankan</h3>
      
      <p>Analis dari Trimegah Sekuritas, Teguh Hartanto, menilai rencana merger ini akan berdampak positif bagi BRI dalam jangka panjang.</p>
      
      <p>"Dengan merger ini, BRI akan dapat mengoptimalkan jaringan dan basis nasabah BRI Agro, terutama di sektor pertanian dan agribisnis yang merupakan fokus utama BRI Agro," kata Teguh.</p>
      
      <p>Teguh memperkirakan merger ini akan meningkatkan aset BRI sekitar 1-2% dan memberikan sinergi pendapatan sekitar Rp500 miliar per tahun.</p>
      
      <p>Sementara itu, ekonom dari Institute for Development of Economics and Finance (INDEF), Bhima Yudhistira, mengatakan bahwa konsolidasi perbankan BUMN merupakan langkah yang tepat untuk menghadapi persaingan global dan digitalisasi perbankan.</p>
      
      <p>"Namun, pemerintah dan regulator perlu memastikan bahwa konsolidasi ini tidak mengurangi akses layanan keuangan bagi masyarakat, terutama di daerah pedesaan dan sektor pertanian yang selama ini dilayani oleh BRI Agro," kata Bhima.</p>
    `,
    relatedNews: ["1", "5"],
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
    content: `
      <p>JAKARTA - PT Unilever Indonesia Tbk (UNVR) mengumumkan fokus strategis pada pengembangan dan ekspansi produk ramah lingkungan. Dalam paparan publik yang digelar pada Rabu (10/5/2025), perseroan menargetkan 50% dari portofolio produknya menggunakan bahan yang dapat didaur ulang pada tahun 2025.</p>
      
      <p>Presiden Direktur Unilever Indonesia, Ira Noviarti, mengatakan bahwa strategi ini sejalan dengan komitmen global Unilever untuk keberlanjutan dan pengurangan dampak lingkungan.</p>
      
      <p>"Kami berkomitmen untuk terus mengembangkan produk-produk yang tidak hanya berkualitas tinggi, tetapi juga ramah lingkungan dan berkelanjutan," ujar Ira.</p>
      
      <p>Menurut Ira, Unilever Indonesia telah menginvestasikan sekitar Rp500 miliar untuk penelitian dan pengembangan produk ramah lingkungan, serta modernisasi fasilitas produksi untuk mendukung inisiatif ini.</p>
      
      <h3>Inovasi Produk</h3>
      
      <p>Direktur Research & Development Unilever Indonesia, Hernie Raharja, menjelaskan bahwa perseroan telah meluncurkan beberapa inovasi produk ramah lingkungan dalam beberapa bulan terakhir.</p>
      
      <p>"Kami telah meluncurkan varian sampo dan sabun dengan kemasan yang dapat didaur ulang 100%, serta deterjen konsentrat yang menggunakan lebih sedikit air dan kemasan," kata Hernie.</p>
      
      <p>Hernie menambahkan bahwa Unilever Indonesia juga sedang mengembangkan teknologi untuk mengurangi penggunaan plastik sekali pakai dalam produk-produknya.</p>
      
      <h3>Respons Pasar</h3>
      
      <p>Direktur Marketing Unilever Indonesia, Enny Hartati, mengatakan bahwa respons konsumen terhadap produk-produk ramah lingkungan Unilever sangat positif.</p>
      
      <p>"Berdasarkan riset pasar kami, 65% konsumen Indonesia saat ini mempertimbangkan faktor keberlanjutan dan dampak lingkungan dalam keputusan pembelian mereka, terutama di kalangan milenial dan Gen Z," kata Enny.</p>
      
      <p>Enny menambahkan bahwa Unilever Indonesia akan terus mengedukasi konsumen tentang pentingnya memilih produk ramah lingkungan melalui berbagai kampanye pemasaran dan program tanggung jawab sosial perusahaan.</p>
      
      <h3>Prospek Bisnis</h3>
      
      <p>Analis dari Kresna Sekuritas, Robertus Hardy, menilai fokus Unilever Indonesia pada produk ramah lingkungan akan memperkuat posisi kompetitif perseroan dalam jangka panjang.</p>
      
      <p>"Meskipun investasi awal cukup besar, dalam jangka panjang strategi ini akan meningkatkan loyalitas konsumen dan membuka peluang pasar baru, terutama di kalangan konsumen yang sadar lingkungan," kata Robertus.</p>
      
      <p>Robertus memperkirakan strategi ini akan mulai berkontribusi positif terhadap kinerja keuangan Unilever Indonesia pada 2026, dengan potensi peningkatan pendapatan sekitar 5-7% per tahun.</p>
    `,
    relatedNews: ["2", "3"],
  },
]

export default function NewsDetailPage() {
  const params = useParams()
  const [newsArticle, setNewsArticle] = useState<any>(null)
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch with a small delay
    const fetchNewsArticle = async () => {
      setIsLoading(true)
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const article = newsArticles.find((article) => article.id === params.id)
      setNewsArticle(article || null)

      if (article && article.relatedNews) {
        const related = newsArticles.filter((a) => article.relatedNews.includes(a.id))
        setRelatedArticles(related)
      }

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
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />

          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!newsArticle) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link href="/berita">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Daftar Berita
            </Link>
          </Button>
          <h1 className="text-2xl font-bold mb-4">Artikel tidak ditemukan</h1>
          <p>Maaf, artikel yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <Button className="mt-4" asChild>
            <Link href="/berita">Kembali ke Halaman Berita</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/berita">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Berita
          </Link>
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold mb-3">{newsArticle.title}</h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
          <div className="flex items-center">
            <Globe className="mr-1.5 h-3.5 w-3.5" />
            <span>{newsArticle.source}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            <span>{newsArticle.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            <span>{newsArticle.time}</span>
          </div>
          <div className="flex items-center">
            <Tag className="mr-1.5 h-3.5 w-3.5" />
            <div className="flex gap-1">
              {newsArticle.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 hover:bg-primary/20"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <article className="article-content mb-8">
          <style jsx global>{`
            .article-content {
              line-height: 1.8;
              color: var(--foreground);
            }
            
            .article-content p {
              text-align: justify;
              margin-bottom: 1.5rem;
              font-size: 1.05rem;
            }
            
            .article-content h3 {
              font-size: 1.5rem;
              font-weight: 700;
              margin-top: 2rem;
              margin-bottom: 1.25rem;
              color: var(--foreground);
            }
            
            .article-content p:first-of-type {
              font-weight: 500;
            }
            
            .article-content p:first-of-type::first-letter {
              font-size: 1.5rem;
              font-weight: 700;
            }
            
            @media (max-width: 640px) {
              .article-content p {
                text-align: left;
                font-size: 1rem;
              }
            }
            
            .dark .article-content {
              color: var(--foreground);
            }
            
            .dark .article-content h3 {
              color: var(--foreground);
            }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: newsArticle.content }} />
        </article>

        <Separator className="my-8" />

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Berita Terkait</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map((article) => (
              <Card key={article.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">
                    <Link href={`/berita/${article.id}`} className="hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center justify-between">
                    <span>{article.source}</span>
                    <span>{article.time}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">{article.snippet}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 hover:bg-primary/20 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
