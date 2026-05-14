"use client"

import React, { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Layers } from "lucide-react"

interface PhotoCarouselProps {
  photos: string[]
  courtName?: string
  initialIndex?: number
}

export function PhotoCarousel({ photos, courtName = "Quadra", initialIndex = 0 }: PhotoCarouselProps) {
  const [index, setIndex] = useState(initialIndex)

  // Sync index if initialIndex changes
  React.useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex])

  if (!photos || photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-zinc-800">
        <Layers className="h-10 w-10 text-zinc-600" />
      </div>
    )
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIndex(i => (i - 1 + photos.length) % photos.length)
  }

  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIndex(i => (i + 1) % photos.length)
  }

  return (
    <div className="relative h-full w-full group/carousel">
      <Image
        src={photos[index]}
        alt={`${courtName} foto ${index + 1}`}
        fill
        className="object-cover transition-opacity duration-300"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
      />

      {/* Arrows — only visible on hover and when >1 photo */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/70 z-10"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/70 z-10"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i) }}
                className={`rounded-full transition-all ${i === index ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"}`}
                aria-label={`Ir para foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
