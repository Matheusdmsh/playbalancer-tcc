"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type HorizontalScrollProps = {
  children: React.ReactNode
  fadeColor?: string
}

export function HorizontalScroll({ children, fadeColor = "rgba(0, 0, 0, 0.7)" }: HorizontalScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef({
    isPointerDown: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
  })
  const suppressClickRef = useRef(false)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      setShowLeftFade(el.scrollLeft > 0)
      setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }

    update()
    el.addEventListener("scroll", update)
    window.addEventListener("resize", update)

    return () => {
      el.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  const scroll = (dir: "left" | "right") => {
    const el = ref.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  const endDrag = () => {
    const state = dragStateRef.current

    dragStateRef.current = {
      isPointerDown: false,
      isDragging: false,
      startX: 0,
      startY: 0,
      startScrollLeft: 0,
    }
    setIsDragging(false)
  }

  useEffect(() => {
    const handleWindowMouseMove = (event: MouseEvent) => {
      const el = ref.current
      const state = dragStateRef.current
      if (!el || !state.isPointerDown) return

      const deltaX = event.clientX - state.startX
      const deltaY = event.clientY - state.startY
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (!state.isDragging && absDeltaX > 4 && absDeltaX > absDeltaY) {
        state.isDragging = true
        suppressClickRef.current = true
        setIsDragging(true)
      }

      if (!state.isDragging) return

      el.scrollLeft = state.startScrollLeft - deltaX
    }

    const handleWindowMouseUp = () => {
      endDrag()
    }

    window.addEventListener("mousemove", handleWindowMouseMove)
    window.addEventListener("mouseup", handleWindowMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove)
      window.removeEventListener("mouseup", handleWindowMouseUp)
    }
  }, [])

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || event.button !== 0) return

    dragStateRef.current = {
      isPointerDown: true,
      isDragging: false,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: el.scrollLeft,
    }

    suppressClickRef.current = false
  }

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return

    event.preventDefault()
    event.stopPropagation()
    suppressClickRef.current = false
  }

  return (
    <div className="relative w-full max-w-full min-w-0 overflow-hidden">

      {/* Left fade */}
      <div
        onClick={() => scroll("left")}
        className="absolute left-0 top-0 z-10 flex h-full w-12 items-center justify-start pl-1 transition-opacity duration-300"
        style={{
          background: `linear-gradient(to right, ${fadeColor}, transparent)`,
          opacity: showLeftFade ? 1 : 0,
          pointerEvents: showLeftFade ? "auto" : "none",
        }}
      >
        <ChevronLeft className="h-5 w-5 text-white/80" />
      </div>

      {/* Right fade */}
      <div
        onClick={() => scroll("right")}
        className="absolute right-0 top-0 z-10 flex h-full w-12 items-center justify-end pr-1 transition-opacity duration-300"
        style={{
          background: `linear-gradient(to left, ${fadeColor}, transparent)`,
          opacity: showRightFade ? 1 : 0,
          pointerEvents: showRightFade ? "auto" : "none",
        }}
      >
        <ChevronRight className="h-5 w-5 text-white/80" />
      </div>

      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        className={`
          flex
          w-full
          max-w-full
          min-w-0
          overflow-x-auto
          overflow-y-hidden
          gap-3
          scrollbar-hide
          select-none
        `}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "auto",
          scrollSnapType: isDragging ? "none" : "x proximity",
        }}
      >
        {children}
      </div>
    </div>
  )
}