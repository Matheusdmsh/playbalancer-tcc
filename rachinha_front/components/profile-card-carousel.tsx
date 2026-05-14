"use client"

import { useEffect, useMemo, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { UserProfileCard } from "@/components/card/user-profile-card"
import type { CardVariant } from "@/components/card/card.types"
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"

interface CardData {
  name?: string
  username: string
  photoUrl?: string
  initials?: string
  skillLevel?: number
  memberSince?: string
  sport?: {
    name: string
    rating?: number
    level?: string
    icon?: React.ReactNode
  }
  groupRole?: "owner" | "admin"
  cardVariant?: CardVariant
}

interface ProfileCardCarouselProps {
  cards: CardData[]
  onCardChange?: (currentIndex: number) => void
  exportCardRef?: React.RefObject<HTMLDivElement | null>
}

export function ProfileCardCarousel({
  cards,
  onCardChange,
  exportCardRef,
}: ProfileCardCarouselProps) {

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewCardIndex, setPreviewCardIndex] = useState(0)

  

  const shouldDuplicateForLoop = cards.length > 1 && cards.length < 5

  const renderedCards = useMemo(
    () => (shouldDuplicateForLoop ? [...cards, ...cards, ...cards] : cards),
    [cards, shouldDuplicateForLoop]
  )

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: renderedCards.length > 1,
    align: "center",
    dragFree: false,
  })

  useEffect(() => {
    if (!emblaApi) return

    if (shouldDuplicateForLoop) {
      emblaApi.scrollTo(cards.length, true)
    }

    const handleSelect = () => {
      const selectedIndex = emblaApi.selectedScrollSnap()
      const normalizedIndex =
        cards.length > 0 ? selectedIndex % cards.length : 0

      setCurrentIndex(normalizedIndex)
      onCardChange?.(normalizedIndex)
    }

    handleSelect()
    emblaApi.on("select", handleSelect)

return () => {
  emblaApi.off("select", handleSelect)
}  }, [emblaApi, onCardChange, shouldDuplicateForLoop, cards.length])

  const goToPrev = () => {
    if (!emblaApi || cards.length <= 1) return
    emblaApi.scrollPrev()
  }

  const goToNext = () => {
    if (!emblaApi || cards.length <= 1) return
    emblaApi.scrollNext()
  }

  const goToIndex = (targetIndex: number) => {
    if (!emblaApi || cards.length <= 1) return

    if (shouldDuplicateForLoop) {
      emblaApi.scrollTo(cards.length + targetIndex)
    } else {
      emblaApi.scrollTo(targetIndex)
    }
  }

  const hasCards = cards.length > 0
  const canNavigate = cards.length > 1

  const openPreview = (targetIndex: number) => {
    setPreviewCardIndex(targetIndex)
    setIsPreviewOpen(true)
  }

  return (
    <div className={`relative w-full ${hasCards ? "px-10 lg:px-14 pb-10" : "pb-2"} overflow-x-hidden`}>

      {/* viewport */}
      <div className="overflow-hidden" ref={emblaRef}>

        <div className="flex touch-pan-y">

          {renderedCards.map((cardData, index) => {
            const normalizedIndex =
              cards.length > 0 ? index % cards.length : index

            const isActive = normalizedIndex === currentIndex

            return (
              <div
                key={`card-${index}`}
                className="flex-[0_0_100%] flex justify-center px-2"
              >
                <div
                  className={`group relative transition-all duration-300 ease-out ${
                    isActive
                      ? "opacity-100 scale-100 cursor-zoom-in"
                      : "opacity-50 scale-95 pointer-events-none"
                  }`}
                  onClick={() => {
                    if (isActive) {
                      openPreview(normalizedIndex)
                    }
                  }}
                  role="button"
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!isActive) return
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      openPreview(normalizedIndex)
                    }
                  }}
                  style={{
                    width: "100%",
                    maxWidth: "200px",
                    margin: "0 auto",
                  }}
                >
                  {isActive && (
                    <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
                      Clique para ampliar
                    </span>
                  )}
                  <UserProfileCard
                    name={cardData.name.toUpperCase()}
                    username={`@${cardData.username.toLowerCase()}`}
                    photoUrl={cardData.photoUrl}
                    initials={cardData.initials}
                    skillLevel={cardData.skillLevel}
                    memberSince={cardData.memberSince}
                    sport={cardData.sport}
                    groupRole={cardData.groupRole}
                    variant={cardData.cardVariant}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {hasCards && (
        <>
          {/* botão esquerda */}
          <button
            onClick={goToPrev}
            disabled={!canNavigate}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 hover:scale-110 disabled:hover:scale-100 text-white rounded-full p-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 z-30"
            aria-label="Card anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* botão direita */}
          <button
            onClick={goToNext}
            disabled={!canNavigate}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 hover:scale-110 disabled:hover:scale-100 text-white rounded-full p-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 z-30"
            aria-label="Próximo card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* dots */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 z-30">

            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className="transition-all cursor-pointer hover:opacity-80"
                style={{
                  width: index === currentIndex ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  backgroundColor:
                    index === currentIndex
                      ? "#f7e7a9"
                      : "rgba(255,255,255,0.3)",
                }}
              />
            ))}

          </div>
        </>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogPortal>
          <DialogOverlay className="z-[1200] bg-black/40 backdrop-blur-sm" />
          <DialogContent className="z-[1201] w-auto max-w-none border-0 bg-transparent p-0 shadow-none [&>button]:hidden data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0">
            <div className="animate-in fade-in zoom-in-50 duration-200">
              <DialogTitle className="sr-only">Card ampliado</DialogTitle>
              {cards[previewCardIndex] && (
                <div className="mx-auto w-[min(92vw,420px)]">
                  <UserProfileCard
                    name={cards[previewCardIndex].name.toUpperCase()}
                    username={`@${cards[previewCardIndex].username.toLowerCase()}`}
                    photoUrl={cards[previewCardIndex].photoUrl}
                    initials={cards[previewCardIndex].initials}
                    skillLevel={cards[previewCardIndex].skillLevel}
                    memberSince={cards[previewCardIndex].memberSince}
                    sport={cards[previewCardIndex].sport}
                    groupRole={cards[previewCardIndex].groupRole}
                    variant={cards[previewCardIndex].cardVariant}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  )
}