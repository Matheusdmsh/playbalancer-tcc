import React from "react"

import SvgCardV1 from "@/assets/cards/v1/component"
import SvgCardV2 from "@/assets/cards/v2/component"

import type { BaseCardVariant, CardVariant } from "./card.types"

export type CardSvgComponent = React.ComponentType<{ photoUrl: string; className?: string }>
export type CardAvailability = "active" | "disabled"

export type CardCatalogEntry = {
  variant: CardVariant
  aspectRatio: string
  component: CardSvgComponent
  baseVariant: CardVariant
  slimVariant: CardVariant
  isSlim: boolean
  availability: CardAvailability
  label?: string
  initialsY?: number
  initialsFontSize?: number
}

export const CARD_CATALOG: Record<string, CardCatalogEntry> = {
  v1: {
    variant: "v1",
    aspectRatio: "4 / 5",
    component: SvgCardV1,
    baseVariant: "v1",
    slimVariant: "v1",
    isSlim: false,
    availability: "active",
    label: "PlayBalance Verde",
    initialsY: 0.42,
    initialsFontSize: 0.22,
  },
  v2: {
    variant: "v2",
    aspectRatio: "4 / 5",
    component: SvgCardV2,
    baseVariant: "v2",
    slimVariant: "v2",
    isSlim: false,
    availability: "active",
    label: "PlayBalance Azul",
    initialsY: 0.42,
    initialsFontSize: 0.22,
  },
}

export const CARD_VARIANTS = Object.keys(CARD_CATALOG) as CardVariant[]

export function isCardVariantProfileSelectable(variant: CardVariant): variant is BaseCardVariant {
  const card = CARD_CATALOG[variant]
  return Boolean(card && !card.isSlim && card.availability === "active")
}

export const PROFILE_SELECTABLE_CARD_VARIANTS = CARD_VARIANTS.filter(isCardVariantProfileSelectable)

export function getCardCatalogEntry(variant: CardVariant): CardCatalogEntry {
  return CARD_CATALOG[variant] ?? CARD_CATALOG.v1
}

export function getCardAvailability(variant: CardVariant): CardAvailability {
  return CARD_CATALOG[variant]?.availability ?? "disabled"
}

export function isCardVariantEnabled(variant: CardVariant): boolean {
  return getCardAvailability(variant) !== "disabled"
}

export function isCardVariantLegacy(variant: CardVariant): boolean {
  return !CARD_CATALOG[variant]
}
