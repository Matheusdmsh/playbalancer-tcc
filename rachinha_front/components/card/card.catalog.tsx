import React from "react"

import SvgCardV4 from "@/assets/cards/v4/component"
import SvgCardV5 from "@/assets/cards/v5/component"
import SvgCardV6 from "@/assets/cards/v6/component"
import SvgCardV7 from "@/assets/cards/v7/component"
import SvgCardV8 from "@/assets/cards/v8/component"
import SvgCardV9 from "@/assets/cards/v9/component"
import SvgCardV4Slim from "@/assets/cards/v4-slim/component"
import SvgCardV5Slim from "@/assets/cards/v5-slim/component"
import SvgCardV6Slim from "@/assets/cards/v6-slim/component"
import SvgCardV7Slim from "@/assets/cards/v7-slim/component"
import SvgCardV8Slim from "@/assets/cards/v8-slim/component"
import SvgCardV9Slim from "@/assets/cards/v9-slim/component"

import type { BaseCardVariant, CardVariant } from "./card.types"

export type CardSvgComponent = React.ComponentType<{ photoUrl: string; className?: string }>
export type CardAvailability = "active" | "legacy" | "disabled"

export type CardCatalogEntry = {
  variant: CardVariant
  aspectRatio: string
  component?: CardSvgComponent
  baseVariant: CardVariant
  slimVariant?: CardVariant
  isSlim: boolean
  availability: CardAvailability
  label?: string
}

// Edite este mapa quando precisar desativar cards temporariamente ou marcar legados.
// Regras:
// - "legacy": mantém compatibilidade de tipo/histórico, mas não entra em seleção ativa.
// - "disabled": remove da seleção e faz a resolução cair no fallback padrão.
// - Se um card base for marcado aqui, a versão slim herda o mesmo estado automaticamente.
export const CARD_VARIANT_AVAILABILITY: Partial<Record<CardVariant, CardAvailability>> = {
  v0: "legacy",
  v1: "legacy",
  v2: "legacy",
  v3: "legacy",
}

function resolveCatalogAvailability(variant: CardVariant, baseVariant: CardVariant): CardAvailability {
  return CARD_VARIANT_AVAILABILITY[variant] ?? CARD_VARIANT_AVAILABILITY[baseVariant] ?? "active"
}

export const CARD_CATALOG: Record<CardVariant, CardCatalogEntry> = {
  v0: {
    variant: "v0",
    aspectRatio: "2 / 3",
    baseVariant: "v0",
    isSlim: false,
    availability: resolveCatalogAvailability("v0", "v0"),
  },
  v1: {
    variant: "v1",
    aspectRatio: "2 / 3",
    baseVariant: "v1",
    isSlim: false,
    availability: resolveCatalogAvailability("v1", "v1"),
  },
  v2: {
    variant: "v2",
    aspectRatio: "2 / 3",
    baseVariant: "v2",
    isSlim: false,
    availability: resolveCatalogAvailability("v2", "v2"),
  },
  v3: {
    variant: "v3",
    aspectRatio: "2 / 3",
    baseVariant: "v3",
    isSlim: false,
    availability: resolveCatalogAvailability("v3", "v3"),
  },
  v4: {
    variant: "v4",
    aspectRatio: "2 / 3",
    component: SvgCardV4,
    baseVariant: "v4",
    slimVariant: "v4-slim",
    isSlim: false,
    availability: resolveCatalogAvailability("v4", "v4"),
    label: "Card V4",
  },
  v5: {
    variant: "v5",
    aspectRatio: "2 / 3",
    component: SvgCardV5,
    baseVariant: "v5",
    slimVariant: "v5-slim",
    isSlim: false,
    availability: resolveCatalogAvailability("v5", "v5"),
    label: "Card V5",
  },
  v6: {
    variant: "v6",
    aspectRatio: "2 / 3",
    component: SvgCardV6,
    baseVariant: "v6",
    slimVariant: "v6-slim",
    isSlim: false,
    availability: resolveCatalogAvailability("v6", "v6"),
    label: "Card V6",
  },
  v7: {
    variant: "v7",
    aspectRatio: "2 / 3",
    component: SvgCardV7,
    baseVariant: "v7",
    slimVariant: "v7-slim",
    isSlim: false,
    availability: resolveCatalogAvailability("v7", "v7"),
    label: "Card V7",
  },
  v8: {
    variant: "v8",
    aspectRatio: "2 / 3",
    component: SvgCardV8,
    baseVariant: "v8",
    slimVariant: "v8-slim",
    isSlim: false,
    availability: resolveCatalogAvailability("v8", "v8"),
    label: "Card V8",
  },
  v9: {
    variant: "v9",
    aspectRatio: "2 / 3",
    component: SvgCardV9,
    baseVariant: "v9",
    slimVariant: "v9-slim",
    isSlim: false,
    availability: resolveCatalogAvailability("v9", "v9"),
    label: "Card V9",
  },
  "v4-slim": {
    variant: "v4-slim",
    aspectRatio: "4 / 5",
    component: SvgCardV4Slim,
    baseVariant: "v4",
    slimVariant: "v4-slim",
    isSlim: true,
    availability: resolveCatalogAvailability("v4-slim", "v4"),
  },
  "v5-slim": {
    variant: "v5-slim",
    aspectRatio: "4 / 5",
    component: SvgCardV5Slim,
    baseVariant: "v5",
    slimVariant: "v5-slim",
    isSlim: true,
    availability: resolveCatalogAvailability("v5-slim", "v5"),
  },
  "v6-slim": {
    variant: "v6-slim",
    aspectRatio: "4 / 5",
    component: SvgCardV6Slim,
    baseVariant: "v6",
    slimVariant: "v6-slim",
    isSlim: true,
    availability: resolveCatalogAvailability("v6-slim", "v6"),
  },
  "v7-slim": {
    variant: "v7-slim",
    aspectRatio: "4 / 5",
    component: SvgCardV7Slim,
    baseVariant: "v7",
    slimVariant: "v7-slim",
    isSlim: true,
    availability: resolveCatalogAvailability("v7-slim", "v7"),
  },
  "v8-slim": {
    variant: "v8-slim",
    aspectRatio: "4 / 5",
    component: SvgCardV8Slim,
    baseVariant: "v8",
    slimVariant: "v8-slim",
    isSlim: true,
    availability: resolveCatalogAvailability("v8-slim", "v8"),
  },
  "v9-slim": {
    variant: "v9-slim",
    aspectRatio: "4 / 5",
    component: SvgCardV9Slim,
    baseVariant: "v9",
    slimVariant: "v9-slim",
    isSlim: true,
    availability: resolveCatalogAvailability("v9-slim", "v9"),
  },
}

export const CARD_VARIANTS = Object.keys(CARD_CATALOG) as CardVariant[]

export function isCardVariantProfileSelectable(variant: CardVariant): variant is BaseCardVariant {
  const card = CARD_CATALOG[variant]
  return !card.isSlim && card.availability === "active" && Boolean(card.component)
}

export const PROFILE_SELECTABLE_CARD_VARIANTS = CARD_VARIANTS.filter(isCardVariantProfileSelectable)

export function getCardCatalogEntry(variant: CardVariant): CardCatalogEntry {
  return CARD_CATALOG[variant]
}

export function getCardAvailability(variant: CardVariant): CardAvailability {
  return CARD_CATALOG[variant].availability
}

export function isCardVariantEnabled(variant: CardVariant): boolean {
  return getCardAvailability(variant) !== "disabled"
}

export function isCardVariantLegacy(variant: CardVariant): boolean {
  return getCardAvailability(variant) === "legacy"
}
