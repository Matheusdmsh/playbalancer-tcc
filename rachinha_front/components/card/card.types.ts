import React from "react"

export type BaseCardVariant = `v${number}`
export type SlimCardVariant = `${BaseCardVariant}-slim`
export type CardVariant = BaseCardVariant | SlimCardVariant

export type UserProfileSport = {
  name: string
  icon?: React.ReactNode
}

export type TextOverlaySlot = {
  show?: boolean
  x?: number
  y?: number
  fontSize?: number
  maxWidthRatio?: number
  color?: string
  fontFamily?: string
  fontWeight?: number
  letterSpacing?: number
  value?: string
}

export type IconOverlaySlot = {
  show?: boolean
  x?: number
  y?: number
  size?: number
  color?: string
  icon?: React.ReactNode
  shadow?: boolean
}

export type StarsOverlaySlot = {
  show?: boolean
  x?: number
  y?: number
  size?: number
  gap?: number
  color?: string
  emptyColor?: string
  value?: number
}

export type CardOverlayConfig = {
  name?: TextOverlaySlot
  username?: TextOverlaySlot
  sportText?: TextOverlaySlot
  sportIcon?: IconOverlaySlot
  roleIcon?: IconOverlaySlot
  stars?: StarsOverlaySlot
}

export type CardOverlayPreset =
  | "auto"
  | "standard"
  | "slim"
  | "empty"

export type UserProfileCardProps = {
  name?: string
  username: string
  photoUrl?: string
  initials?: string
  missingPhotoNode?: React.ReactNode
  skillLevel?: number
  variant?: CardVariant
  preferSlim?: boolean
  sport?: UserProfileSport
  memberSince?: string
  onPhotoChange?: (file: File) => void
  groupRole?: "owner" | "admin"
  overlayPreset?: CardOverlayPreset
  className?: string
}
