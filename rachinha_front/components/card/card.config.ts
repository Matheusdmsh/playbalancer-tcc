import { BaseCardVariant, CardOverlayConfig, CardOverlayPreset, CardVariant } from "./card.types"
import { CARD_CATALOG, CARD_VARIANTS, getCardAvailability, PROFILE_SELECTABLE_CARD_VARIANTS } from "./card.catalog"

export type ResolvedCardOverlayConfig = Required<CardOverlayConfig>
type CardOverlayConfigOverrides = {
  [K in keyof ResolvedCardOverlayConfig]?: Partial<ResolvedCardOverlayConfig[K]>
}
type CardVariantOverlayPresetOverrides = Partial<Record<CardOverlayPreset, CardOverlayConfigOverrides>>

export type ProfileSelectableCardVariant = BaseCardVariant

export type ProfileCardCatalogEntry = {
  id: ProfileSelectableCardVariant
  label: string
  previewVariant: CardVariant
}

export const DEFAULT_CARD_SCALE = 1.15

export const DEFAULT_VARIANT: CardVariant = "v4"
export const DEFAULT_CARD_FONT_FAMILY = "var(--font-card-display), Inter, sans-serif"

export const DEFAULT_OVERLAYS: ResolvedCardOverlayConfig = {
  name: {
    show: true,
    x: 0.5,
    y: 0.63,
    fontSize: 0.08,
    color: "#FFFFFF",
    fontFamily: DEFAULT_CARD_FONT_FAMILY,
    fontWeight: 700,
    letterSpacing: 0,
  },
  username: {
    show: true,
    x: 0.5,
    y: 0.675,
    fontSize: 0.04,
    color: "#9b9b9b",
    fontFamily: DEFAULT_CARD_FONT_FAMILY,
    fontWeight: 400,
    letterSpacing: 0,
  },
  sportText: {
    show: true,
    x: 0.5,
    y: 0.808,
    fontSize: 0.035,
    color: "#D4B962",
    fontFamily: DEFAULT_CARD_FONT_FAMILY,
    fontWeight: 400,
    letterSpacing: 0,
  },
  sportIcon: {
    show: true,
    x: 0.5,
    y: 0.845,
    size: 0.06,
    color: "#D4B962",
  },
  roleIcon: {
    show: true,
    x: 0.5,
    y: 0.565,
    size: 0.07,
    color: "#FCD34D",
  },
  stars: {
    show: true,
    x: 0.5,
    y: 0.74,
    size: 0.06,
    gap: 0.008,
    color: "#FCD34D",
    emptyColor: "#6B7280",
  },
}

export const DEFAULT_SLIM_OVERLAYS: ResolvedCardOverlayConfig = {
  name: {
    show: true,
    x: 0.5,
    y: 0.68,
    fontSize: 0.08,
    color: "#FFFFFF",
    fontFamily: DEFAULT_CARD_FONT_FAMILY,
    fontWeight: 700,
    letterSpacing: 0,
  },
  username: {
    show: true,
    x: 0.5,
    y: 0.73,
    fontSize: 0.04,
    color: "#9b9b9b",
    fontFamily: DEFAULT_CARD_FONT_FAMILY,
    fontWeight: 400,
    letterSpacing: 0,
  },
  sportText: {
    show: false,
    x: 0.165,
    y: 0.955,
    fontSize: 0.038,
    color: "#FFFFFF",
    fontFamily: DEFAULT_CARD_FONT_FAMILY,
    fontWeight: 500,
    letterSpacing: 0,
  },
  sportIcon: {
    show: false,
    x: 0.115,
    y: 0.955,
    size: 0.047,
    color: "#FFFFFF",
  },
  roleIcon: {
    show: false,
    x: 0.905,
    y: 0.08,
    size: 0.08,
    color: "#FCD34D",
  },
  stars: {
    show: false,
    x: 0.915,
    y: 0.96,
    size: 0.038,
    gap: 0.008,
    color: "#FCD34D",
    emptyColor: "#6B7280",
  },
}

export const EMPTY_CARD_OVERLAYS: ResolvedCardOverlayConfig = {
  ...DEFAULT_OVERLAYS,
  name: {
    ...DEFAULT_OVERLAYS.name,
    y: 0.66,
    fontSize: 0.07,
    color: "#71717a",
  },
  username: {
    ...DEFAULT_OVERLAYS.username,
    y: 0.72,
    fontSize: 0.03,
    color: "#52525b",
    fontWeight: 500,
  },
  stars: {
    ...DEFAULT_OVERLAYS.stars,
    show: false,
  },
  sportText: {
    ...DEFAULT_OVERLAYS.sportText,
    show: false,
  },
  sportIcon: {
    ...DEFAULT_OVERLAYS.sportIcon,
    show: false,
  },
}

// Toda customização visual específica de variante deve ficar aqui.
// Regras:
// - se não houver override para a variante, o card usa apenas o preset-base.
// - `auto` ajusta o preset padrão daquela variante.
// - presets específicos (`standard`, `slim`, `empty`) podem ser sobrescritos quando necessário.
// Exemplo ativo: a V6 usa esporte e ícone do esporte em 22F0F6 no preset automático/padrão.
export const CARD_VARIANT_OVERLAY_PRESET_OVERRIDES: Partial<Record<CardVariant, CardVariantOverlayPresetOverrides>> = {
  v6: {
    auto: {
      sportText: {
        color: "#22F0F6",
      },
      sportIcon: {
        color: "#22F0F6",
      },
    },
    standard: {
      sportText: {
        color: "#22F0F6",
      },
      sportIcon: {
        color: "#22F0F6",
      },
    },
  },

  v7: {
    auto: {
      sportText: {
        color: "#16A34B",
      },
      sportIcon: {
        color: "#16A34B",
      },
    },
    standard: {
      sportText: {
        color: "#16A34B",
      },
      sportIcon: {
        color: "#16A34B",
      },
    },
  },

  v8: {
    auto: {
      sportText: {
        color: "#9A9A9A",
      },
      sportIcon: {
        color: "#9A9A9A",
      },
    },
    standard: {
      sportText: {
        color: "#9A9A9A",
      },
      sportIcon: {
        color: "#9A9A9A",
      },
    },
  },

}

function mergeOverlayConfig(
  baseConfig: ResolvedCardOverlayConfig,
  overrides?: CardOverlayConfigOverrides
): ResolvedCardOverlayConfig {
  if (!overrides) {
    return baseConfig
  }

  return {
    name: { ...baseConfig.name, ...overrides.name },
    username: { ...baseConfig.username, ...overrides.username },
    sportText: { ...baseConfig.sportText, ...overrides.sportText },
    sportIcon: { ...baseConfig.sportIcon, ...overrides.sportIcon },
    roleIcon: { ...baseConfig.roleIcon, ...overrides.roleIcon },
    stars: { ...baseConfig.stars, ...overrides.stars },
  }
}

function applyVariantOverlayOverrides(
  baseConfig: ResolvedCardOverlayConfig,
  variant: CardVariant,
  preset: CardOverlayPreset
): ResolvedCardOverlayConfig {
  const baseVariant = CARD_CATALOG[variant].baseVariant
  const baseVariantOverrides = CARD_VARIANT_OVERLAY_PRESET_OVERRIDES[baseVariant]?.[preset]
  const variantOverrides = CARD_VARIANT_OVERLAY_PRESET_OVERRIDES[variant]?.[preset]

  return mergeOverlayConfig(mergeOverlayConfig(baseConfig, baseVariantOverrides), variantOverrides)
}

export function getDefaultOverlaysForVariant(variant: CardVariant): ResolvedCardOverlayConfig {
  const baseConfig = variant.endsWith("-slim") ? DEFAULT_SLIM_OVERLAYS : DEFAULT_OVERLAYS
  return applyVariantOverlayOverrides(baseConfig, variant, "auto")
}

export function getCardOverlayPreset(
  preset: CardOverlayPreset | undefined,
  variant: CardVariant
): ResolvedCardOverlayConfig {
  const resolvedPreset = preset ?? "auto"

  switch (preset) {
    case "standard":
      return applyVariantOverlayOverrides(DEFAULT_OVERLAYS, variant, resolvedPreset)
    case "slim":
      return applyVariantOverlayOverrides(DEFAULT_SLIM_OVERLAYS, variant, resolvedPreset)
    case "empty":
      return applyVariantOverlayOverrides(EMPTY_CARD_OVERLAYS, variant, resolvedPreset)
    case "auto":
    case undefined:
    default:
      return getDefaultOverlaysForVariant(variant)
  }
}
export const PROFILE_CARD_CATALOG: ProfileCardCatalogEntry[] = [
  ...PROFILE_SELECTABLE_CARD_VARIANTS.map((variant) => {
    const card = CARD_CATALOG[variant]

    return {
      id: variant,
      label: card.label ?? variant.toUpperCase(),
      previewVariant: card.slimVariant ?? variant,
    }
  }),
]

const VALID_CARD_VARIANTS = CARD_VARIANTS
const PROFILE_CARD_IDS = new Set<ProfileSelectableCardVariant>(PROFILE_SELECTABLE_CARD_VARIANTS)

export function resolveCardVariant(
  value?: string | null,
  options?: { preferSlim?: boolean; fallback?: CardVariant }
): CardVariant {
  const fallback = options?.fallback ?? "v5"
  const normalized = typeof value === "string" ? value.trim() : ""

  const baseVariant = VALID_CARD_VARIANTS.includes(normalized as CardVariant)
    ? (normalized as CardVariant)
    : fallback

  if (getCardAvailability(baseVariant) === "disabled") {
    return fallback
  }

  if (!options?.preferSlim) return baseVariant

  if (baseVariant.endsWith("-slim")) {
    return baseVariant
  }

  const preferredSlimVariant = CARD_CATALOG[baseVariant].slimVariant ?? baseVariant

  return getCardAvailability(preferredSlimVariant) === "disabled"
    ? fallback
    : preferredSlimVariant
}

export function resolveProfileSelectableCardVariant(
  value?: string | null,
  fallback: ProfileSelectableCardVariant = "v4"
): ProfileSelectableCardVariant {
  const resolvedVariant = resolveCardVariant(value, { fallback })
  const baseVariant = resolvedVariant.endsWith("-slim")
    ? (resolvedVariant.slice(0, -5) as ProfileSelectableCardVariant)
    : (resolvedVariant as ProfileSelectableCardVariant)

  return PROFILE_CARD_IDS.has(baseVariant) ? baseVariant : fallback
}

export function getProfileSelectableCardIndex(value?: string | null): number {
  const selectedVariant = resolveProfileSelectableCardVariant(value)
  const selectedIndex = PROFILE_CARD_CATALOG.findIndex((entry) => entry.id === selectedVariant)
  return selectedIndex >= 0 ? selectedIndex : 0
}
