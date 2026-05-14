"use client"

import React, { CSSProperties, useLayoutEffect, useRef, useState } from "react"
import { Crown, ShieldPlus } from "lucide-react"

import { cn } from "@/lib/utils"
import { RatingStars, normalizeSkillRating } from "@/components/ui/rating-stars"

import { DEFAULT_CARD_FONT_FAMILY, DEFAULT_CARD_SCALE, getCardOverlayPreset, resolveCardVariant } from "./card.config"
import { CARD_CATALOG } from "./card.catalog"
import type { CardSvgComponent } from "./card.catalog"
import {
  IconOverlaySlot,
  StarsOverlaySlot,
  TextOverlaySlot,
  UserProfileCardProps,
} from "./card.types"

function clamp01(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.max(0, Math.min(1, value))
}

function getTextStyle(slot: TextOverlaySlot, width: number, scale: number): CSSProperties {
  return {
    left: `${clamp01(slot.x, 0.5) * 100}%`,
    top: `${clamp01(slot.y, 0.5) * 100}%`,
    transform: "translate(-50%, -50%)",
    width: width * (slot.maxWidthRatio ?? 0.62) * scale,
    maxWidth: width * (slot.maxWidthRatio ?? 0.62) * scale,
    fontSize: width * (slot.fontSize ?? 0.05) * scale,
    fontWeight: slot.fontWeight ?? 600,
    color: slot.color,
    fontFamily: slot.fontFamily ?? DEFAULT_CARD_FONT_FAMILY,
    letterSpacing: width * (slot.letterSpacing ?? 0),
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "center",
    lineHeight: 1,
  }
}

function getIconStyle(slot: IconOverlaySlot, width: number, scale: number): CSSProperties {
  const sizePx = width * (slot.size ?? 0.05) * scale
  return {
    left: `${clamp01(slot.x, 0.5) * 100}%`,
    top: `${clamp01(slot.y, 0.5) * 100}%`,
    transform: "translate(-50%, -50%)",
    color: slot.color,
    width: sizePx,
    height: sizePx,
    fontSize: sizePx,
    lineHeight: 1,
    filter: slot.shadow ? "drop-shadow(0 2px 4px rgba(0,0,0,0.85)) drop-shadow(0 0px 8px rgba(0,0,0,0.6))" : undefined,
  }
}

function getStarsStyle(slot: StarsOverlaySlot, width: number, scale: number): CSSProperties {
  return {
    left: `${clamp01(slot.x, 0.9) * 100}%`,
    top: `${clamp01(slot.y, 0.95) * 100}%`,
    transform: "translate(-50%, -50%)",
    gap: width * (slot.gap ?? 0.008) * scale,
  }
}

function buildDisplayInitials(name?: string, initials?: string): string | null {
  const source = (name && name.trim()) || (initials && initials.trim())
  if (!source) return null

  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  const compact = source.replace(/\s+/g, "")
  if (compact.length >= 2) {
    return `${compact[0]}${compact[1]}`.toUpperCase()
  }

  return compact[0]?.toUpperCase() ?? null
}

const EMPTY_CARD_COMPONENT: CardSvgComponent = () => null

export function UserProfileCard({
  name,
  username,
  photoUrl,
  initials,
  missingPhotoNode,
  skillLevel,
  variant,
  preferSlim,
  sport,
  groupRole,
  overlayPreset = "auto",
  className,
}: UserProfileCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const node = containerRef.current
    if (!node) return

    const updateWidth = () => {
      const nextWidth = node.getBoundingClientRect().width
      if (nextWidth > 0) {
        setWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth))
      }
    }

    updateWidth()

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextWidth = entry.contentRect.width
        if (nextWidth > 0) {
          setWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth))
        }
      }
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const measuredWidth = width ?? 0
  const hasMeasuredWidth = measuredWidth > 0

  const scale = DEFAULT_CARD_SCALE
  const resolvedVariant = resolveCardVariant(variant, { preferSlim, fallback: "v5" })
  const cardDefinition = CARD_CATALOG[resolvedVariant]
  const SvgComponent: CardSvgComponent = cardDefinition.component ?? CARD_CATALOG.v5.component ?? EMPTY_CARD_COMPONENT
  const aspectRatio = cardDefinition.aspectRatio
  const resolvedOverlays = getCardOverlayPreset(overlayPreset, resolvedVariant)

  const resolvedName = resolvedOverlays.name
  const resolvedUsername = resolvedOverlays.username
  const resolvedSportText = resolvedOverlays.sportText
  const resolvedSportIcon = resolvedOverlays.sportIcon
  const resolvedRoleIcon = resolvedOverlays.roleIcon
  const resolvedStars = resolvedOverlays.stars

  const displayName = resolvedName.value ?? name ?? initials ?? username
  const displayUsername = resolvedUsername.value ?? username
  const displaySport = resolvedSportText.value ?? sport?.name
  const starsValue = normalizeSkillRating(resolvedStars.value != null ? resolvedStars.value : skillLevel ?? 0)
  const displayInitials = buildDisplayInitials(name, initials)

  const roleIcon =
    groupRole === "owner"
      ? <Crown className="h-full w-full" />
      : groupRole === "admin"
        ? <ShieldPlus className="h-full w-full" />
        : null

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-[420px]", className)}
      style={{ aspectRatio }}
    >
      <SvgComponent photoUrl={photoUrl ?? ""} className="absolute inset-0 h-full w-full" />

      {hasMeasuredWidth && !photoUrl && missingPhotoNode && (
        <div
          className="pointer-events-none absolute flex items-center justify-center text-white/30"
          style={{
            left: "50%",
            top: "37%",
            transform: "translate(-50%, -50%)",
            width: measuredWidth * 0.24 * scale,
            height: measuredWidth * 0.24 * scale,
          }}
        >
          {missingPhotoNode}
        </div>
      )}

      {hasMeasuredWidth && !photoUrl && !missingPhotoNode && displayInitials && (
        <div
          className="pointer-events-none absolute flex items-center justify-center font-bold text-white/30 select-none leading-none"
          style={{
            left: "50%",
            top: "37%",
            transform: "translate(-50%, -50%)",
            fontSize: measuredWidth * 0.23 * scale,
          }}
        >
          {displayInitials}
        </div>
      )}

      {hasMeasuredWidth && resolvedName.show !== false && displayName && (
        <div className="pointer-events-none absolute leading-none" style={getTextStyle(resolvedName, measuredWidth, scale)}>
          {displayName}
        </div>
      )}

      {hasMeasuredWidth && resolvedUsername.show !== false && displayUsername && (
        <div className="pointer-events-none absolute leading-none" style={getTextStyle(resolvedUsername, measuredWidth, scale)}>
          {displayUsername}
        </div>
      )}

      {hasMeasuredWidth && resolvedSportText.show !== false && displaySport && (
        <div className="pointer-events-none absolute leading-none" style={getTextStyle(resolvedSportText, measuredWidth, scale)}>
          {displaySport}
        </div>
      )}

      {hasMeasuredWidth && resolvedSportIcon.show !== false && (resolvedSportIcon.icon ?? sport?.icon) && (
        <div className="pointer-events-none absolute [&>svg]:h-full [&>svg]:w-full [&>svg]:!text-[inherit]" style={getIconStyle(resolvedSportIcon, measuredWidth, scale)}>
          {resolvedSportIcon.icon ?? sport?.icon}
        </div>
      )}

      {hasMeasuredWidth && resolvedRoleIcon.show !== false && (resolvedRoleIcon.icon ?? roleIcon) && (
        <div className="pointer-events-none absolute [&>svg]:h-full [&>svg]:w-full [&>svg]:!text-[inherit]" style={getIconStyle(resolvedRoleIcon, measuredWidth, scale)}>
          {resolvedRoleIcon.icon ?? roleIcon}
        </div>
      )}

      {hasMeasuredWidth && resolvedStars.show !== false && (
        <div className="pointer-events-none absolute flex items-center" style={getStarsStyle(resolvedStars, measuredWidth, scale)}>
          <RatingStars
            value={starsValue}
            size={measuredWidth * (resolvedStars.size ?? 0.038) * scale}
            gap={measuredWidth * (resolvedStars.gap ?? 0.008) * scale}
            filledColor={resolvedStars.color}
            emptyColor={resolvedStars.emptyColor}
          />
        </div>
      )}
    </div>
  )
}

export default UserProfileCard
