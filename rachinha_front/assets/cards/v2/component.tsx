import React from "react"
import { USER_PROFILE_CARD_DESIGN } from "./user-profile-card.config"
import { UserProfileCardColorSet } from "./types"

const BRAND_LOGO_PATH =
  "M355.63 80.9739C355.458 77.4375 355.031 73.9219 354.677 70.401C354.469 68.6354 354.187 66.8802 353.953 65.1302C353.724 63.3646 353.453 61.6146 353.12 59.8698C351.979 52.8437 350.333 45.8906 348.568 38.9479C346.271 30.5833 343.547 22.3125 340.448 14.1406C338.687 18.8125 336.844 23.4062 335.021 27.9375L331.969 36.3125L324.844 30.4844C314.547 22.0521 302.885 15.4479 290.479 10.7292C278.057 6.00519 264.922 3.14061 251.589 1.70311C238.234 0.270818 224.677 0.265611 211.146 1.21353C202.797 1.80207 194.458 2.76561 186.135 4.02082L195.406 17.5677L203.297 28.9271L190.115 32.0052C169.88 36.7396 149.964 43.0885 130.75 51.25C111.5 59.3594 92.8698 69.0469 75.0052 80.0833C57.1302 91.1146 39.9948 103.422 23.526 116.651C15.5521 123.062 7.72916 129.682 0.0104065 136.448L111.922 82.7344L105.042 99.9635C105.042 99.9635 151.219 80.6198 190.141 76.7917C223.458 73.5156 251.995 83.2187 235.635 108.13C235.411 108.469 235.25 108.854 235.047 109.203C235.021 109.245 235 109.281 234.984 109.318H234.974C234.021 110.937 232.964 112.443 231.849 113.885C225.328 122.026 217.432 128.203 209.385 134.021C205.333 136.896 201.203 139.62 196.995 142.245C192.745 144.859 188.583 147.37 183.969 149.802L173.938 154.333L176.281 143.536C177.505 137.865 179.208 132.214 180.953 126.906C181.245 126.026 181.516 125.151 181.786 124.281C179.271 125.786 176.776 127.286 174.292 128.802C168.099 132.604 162.109 136.625 156.359 140.865C144.792 149.286 134.333 158.891 125.302 169.49C120.797 174.807 116.693 180.411 113.031 186.271C109.359 192.109 106.083 198.182 103.276 204.458L101.276 209.203C100.615 210.786 100.047 212.417 99.4323 214.016C98.7917 215.609 98.3125 217.266 97.75 218.896L96.9375 221.344L96.3073 223.583C94.7292 229.578 94.1979 235.458 94.9167 240.995C95.6406 246.536 97.6094 251.734 100.661 256.604C103.75 261.443 107.932 265.896 112.828 269.854C122.292 277.536 134.307 283.448 146.422 287.26C127.104 277.786 119.078 263.635 116.531 249.766C105.896 220.49 137.115 177.208 158.198 157.651C160.516 171.521 161.562 179.13 161.562 179.13C161.562 179.13 275.948 128.776 260.042 84.6302C244.74 42.1823 169.214 57.0833 136.552 61.6823C175.974 39.901 233.349 40.1771 233.349 40.1771C233.349 40.1771 230.729 33.5625 218.599 22.8281C273.37 24.776 306.271 47.0052 320.562 78.0104L328.995 56.9844C341.724 102.354 323.734 154.208 323.734 154.208L323.724 154.198C315.625 182.505 298.344 211.104 273.25 235.13C262.542 245.385 247.089 255.891 229.74 264.01C289.052 210.661 334.219 50.5677 228.646 49.1667C301.495 69.2864 277.656 147.849 226.859 175.047C192.328 193.526 174.979 215.057 168.375 233.875C168.203 234.385 168.036 234.88 167.885 235.38C159.083 264.203 187.146 290.901 215.724 281.323C219.104 280.182 222.469 278.953 225.797 277.625C251.589 267.255 275.578 251.672 295.656 232.151C315.693 212.609 332.182 189.286 342.589 163.349C347.734 150.38 351.682 136.896 353.792 123.042C354.391 119.589 354.74 116.099 355.156 112.62C355.422 109.12 355.76 105.62 355.849 102.104C356.057 98.5989 356.021 95.0729 356.062 91.5469C355.948 88.026 355.932 84.5 355.63 80.9739Z"

interface SvgCardV2Props {
  colorSet: UserProfileCardColorSet
  idPrefix: string
  strokeWidth: number
}

const CARD_PATH = `
  M86 6
  H314
  Q354 6 354 42
  V362
  Q354 382 339 392
  L217 452
  Q200 460 183 452
  L61 392
  Q46 382 46 362
  V42
  Q46 6 86 6
  Z
`

export function SvgCardV2Base({ colorSet, idPrefix }: Omit<SvgCardV2Props, "strokeWidth">) {
  const greenId = `${idPrefix}-green`
  const textureId = `${idPrefix}-texture`
  const cardBaseId = `${idPrefix}-card-base`

  return (
    <svg viewBox={USER_PROFILE_CARD_DESIGN.viewBox} xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 h-full w-full" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id={greenId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorSet.greenStart} />
          <stop offset="50%" stopColor={colorSet.greenMid} />
          <stop offset="100%" stopColor={colorSet.greenEnd} />
        </linearGradient>
        <pattern id={textureId} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 6 L6 0" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </pattern>
      </defs>

      <path id={cardBaseId} d={CARD_PATH} fill={`url(#${greenId})`} />
      <use href={`#${cardBaseId}`} fill={`url(#${textureId})`} opacity="0.6" />
    </svg>
  )
}

export function SvgCardV2Border({ colorSet, idPrefix, strokeWidth }: SvgCardV2Props) {
  const goldBorderId = `${idPrefix}-gold-border`
  const innerBorderMaskId = `${idPrefix}-inner-border-mask`

  return (
    <svg viewBox={USER_PROFILE_CARD_DESIGN.viewBox} xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 h-full w-full pointer-events-none" style={{ zIndex: 3 }}>
      <defs>
        <linearGradient id={goldBorderId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorSet.borderStart} />
          <stop offset="50%" stopColor={colorSet.borderMid} />
          <stop offset="100%" stopColor={colorSet.borderEnd} />
        </linearGradient>

        <mask id={innerBorderMaskId}>
          <rect width="400" height="480" fill="white" />
          <rect x="120" y="12" width="160" height="24" rx="12" fill="black" />
          <circle cx="200" cy="446" r="30" fill="black" />
        </mask>
      </defs>

      <path
        d="
          M100 20
          H300
          Q335 20 335 50
          V350
          Q335 370 323 378
          L210 435
          Q200 441 190 435
          L77 378
          Q65 370 65 350
          V50
          Q65 20 100 20
          Z
        "
        fill="none"
        stroke={`url(#${goldBorderId})`}
        strokeWidth={strokeWidth}
        mask={`url(#${innerBorderMaskId})`}
      />

      {/* Branding no pill superior: logo icon + RACHINHA.COM */}
      <g transform="translate(144.5, 18.34) scale(0.039326)">
        <path d={BRAND_LOGO_PATH} fill={colorSet.accent} />
      </g>
      <text
        x="163.5"
        y="24"
        fill={colorSet.accent}
        fontSize="11"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        letterSpacing="1.5"
        textLength="92"
        lengthAdjust="spacingAndGlyphs"
        dominantBaseline="central"
      >
        RACHINHA.COM
      </text>

      {/* Branding no círculo inferior: logo icon centralizado */}
      <g transform="translate(189, 437.1) scale(0.061798)">
        <path d={BRAND_LOGO_PATH} fill={colorSet.accent} />
      </g>
    </svg>
  )
}
