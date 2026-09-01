import { Star } from "lucide-react"
import type { CSSProperties } from "react"

export function normalizeSkillRating(value: number | null | undefined): number {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  const clampedValue = Math.max(0, Math.min(5, numericValue))
  return Math.round(clampedValue * 2) / 2
}

interface RatingStarsProps {
  value: number | null | undefined
  size?: number
  gap?: number
  className?: string
  starClassName?: string
  filledColor?: CSSProperties["color"]
  emptyColor?: CSSProperties["color"]
}

export function RatingStars({
  value,
  size = 16,
  gap = 2,
  className,
  starClassName,
  filledColor,
  emptyColor,
}: RatingStarsProps) {
  const normalizedValue = normalizeSkillRating(value)

  return (
    <div
      className={["inline-flex items-center", className].filter(Boolean).join(" ")}
      style={{ gap: `${gap}px` }}
      aria-label={`Nota ${normalizedValue} de 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const fillRatio = Math.max(0, Math.min(1, normalizedValue - index))

        return (
          <span
            key={index}
            className="relative inline-flex shrink-0"
            style={{ width: size, height: size }}
          >
            <Star
              size={size}
              className={starClassName}
              style={{ color: emptyColor }}
            />
            {fillRatio > 0 && (
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fillRatio * 100}%` }}
              >
                <Star
                  size={size}
                  className={["fill-current", starClassName].filter(Boolean).join(" ")}
                  style={{ color: filledColor }}
                />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}