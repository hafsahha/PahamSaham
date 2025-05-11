"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

export default function StockTicker() {
  const [duplicated, setDuplicated] = useState(false)

  useEffect(() => {
    // Duplicate items after component mounts to ensure smooth infinite scroll
    setDuplicated(true)
  }, [])

  const tickerItems = [
    { symbol: "BBCA", price: "9.250", change: "+2,4%", isPositive: true },
    { symbol: "BBRI", price: "5.175", change: "+1,2%", isPositive: true },
    { symbol: "TLKM", price: "3.850", change: "-0,8%", isPositive: false },
    { symbol: "ASII", price: "4.680", change: "+3,1%", isPositive: true },
    { symbol: "UNVR", price: "3.750", change: "-1,4%", isPositive: false },
    { symbol: "BMRI", price: "6.125", change: "+0,8%", isPositive: true },
    { symbol: "PGAS", price: "1.450", change: "+1,7%", isPositive: true },
    { symbol: "ANTM", price: "2.350", change: "+4,2%", isPositive: true },
    { symbol: "INDF", price: "6.750", change: "-0,4%", isPositive: false },
    { symbol: "ICBP", price: "9.875", change: "+0,6%", isPositive: true },
  ]

  return (
    <div className="hidden md:block flex-1 overflow-hidden bg-white/50 dark:bg-background/50 backdrop-blur-sm border-x border-secondary/20">
      <div className="ticker-wrap">
        <div className="ticker">
          {tickerItems.map((item, index) => (
            <div key={index} className="ticker-item">
              <span className="font-medium text-primary">{item.symbol}</span>
              <span className="mx-1">Rp{item.price}</span>
              <span className={`flex items-center ${item.isPositive ? "text-accent" : "text-red-500"}`}>
                {item.isPositive ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                {item.change}
              </span>
            </div>
          ))}
          {duplicated &&
            tickerItems.map((item, index) => (
              <div key={`dup-${index}`} className="ticker-item">
                <span className="font-medium text-primary">{item.symbol}</span>
                <span className="mx-1">Rp{item.price}</span>
                <span className={`flex items-center ${item.isPositive ? "text-accent" : "text-red-500"}`}>
                  {item.isPositive ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
                  {item.change}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
