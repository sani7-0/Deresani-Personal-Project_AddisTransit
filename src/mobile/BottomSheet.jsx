"use client"
import { useEffect, useMemo, useRef, useState } from "react"

export default function BottomSheet({ initial = "collapsed", collapsedHeight = 140, expandedHeight = 420, children }) {
  const containerRef = useRef(null)
  const [open, setOpen] = useState(initial === "expanded")
  const [height, setHeight] = useState(collapsedHeight)

  useEffect(() => {
    setHeight(open ? expandedHeight : collapsedHeight)
  }, [open, collapsedHeight, expandedHeight])

  return (
    <div className="safe-screen absolute left-0 right-0 bottom-0">
      <div className="mx-2 mb-2 rounded-[16px] overflow-hidden border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-center py-2">
          <div className="w-10 h-1.5 rounded-full" style={{ backgroundColor: '#2ECC71' }} />
        </button>
        <div ref={containerRef} style={{ height }} className="overflow-auto transition-[height] duration-300 ease-out">
          {children}
        </div>
      </div>
    </div>
  )
}


