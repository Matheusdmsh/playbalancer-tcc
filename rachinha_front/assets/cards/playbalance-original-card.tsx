"use client"

import { useId } from "react"

type PlayBalancePalette = "green" | "blue"

type PlayBalanceOriginalCardProps = {
  className?: string
  palette: PlayBalancePalette
}

const PALETTES = {
  green: {
    backgroundStart: "#101713",
    backgroundMiddle: "#080B09",
    backgroundEnd: "#030504",
    accentStart: "#C9FF68",
    accentMiddle: "#70ED2B",
    accentEnd: "#31B817",
    glow: "#82F438",
    detail: "#8CF13E",
    logoLight: "#D9FF9B",
  },
  blue: {
    backgroundStart: "#0A111D",
    backgroundMiddle: "#050912",
    backgroundEnd: "#02040A",
    accentStart: "#65ECFF",
    accentMiddle: "#268CFF",
    accentEnd: "#2454FF",
    glow: "#35C9FF",
    detail: "#399FFF",
    logoLight: "#C9F8FF",
  },
} as const

export function PlayBalanceOriginalCard({
  className,
  palette,
}: PlayBalanceOriginalCardProps) {
  const colors = PALETTES[palette]
  const instanceId = useId().replace(/:/g, "")
  const backgroundId = `pb-background-${instanceId}`
  const borderId = `pb-border-${instanceId}`
  const ambientId = `pb-ambient-${instanceId}`
  const namePlateId = `pb-name-plate-${instanceId}`
  const logoId = `pb-logo-${instanceId}`
  const clipId = `pb-clip-${instanceId}`

  const cardPath = "M138 70H942C968.51 70 990 91.49 990 118V1052.5C990 1093.88 966.154 1131.54 928.771 1149.31L570.916 1319.43C551.37 1328.72 528.63 1328.72 509.084 1319.43L151.229 1149.31C113.846 1131.54 90 1093.88 90 1052.5V118C90 91.49 111.49 70 138 70Z"

  return (
    <svg
      viewBox="0 0 1080 1350"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Card PlayBalance ${palette === "green" ? "verde" : "azul"}`}
    >
      <defs>
        <linearGradient id={backgroundId} x1="184" y1="76" x2="906" y2="1270" gradientUnits="userSpaceOnUse">
          <stop stopColor={colors.backgroundStart} />
          <stop offset="0.5" stopColor={colors.backgroundMiddle} />
          <stop offset="1" stopColor={colors.backgroundEnd} />
        </linearGradient>
        <linearGradient id={borderId} x1="122" y1="104" x2="936" y2="1240" gradientUnits="userSpaceOnUse">
          <stop stopColor={colors.accentStart} />
          <stop offset="0.48" stopColor={colors.accentMiddle} />
          <stop offset="1" stopColor={colors.accentEnd} />
        </linearGradient>
        <linearGradient id={namePlateId} x1="540" y1="850" x2="540" y2="1240" gradientUnits="userSpaceOnUse">
          <stop stopColor={colors.backgroundMiddle} stopOpacity="0" />
          <stop offset="0.42" stopColor={colors.backgroundMiddle} stopOpacity="0.9" />
          <stop offset="1" stopColor={colors.backgroundEnd} />
        </linearGradient>
        <radialGradient id={ambientId} cx="0" cy="0" r="1" gradientTransform="translate(540 532) rotate(90) scale(430)" gradientUnits="userSpaceOnUse">
          <stop stopColor={colors.glow} stopOpacity="0.15" />
          <stop offset="0.58" stopColor={colors.accentMiddle} stopOpacity="0.04" />
          <stop offset="1" stopColor={colors.accentMiddle} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={logoId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={colors.accentStart} />
          <stop offset="0.55" stopColor={colors.accentMiddle} />
          <stop offset="1" stopColor={colors.accentEnd} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={cardPath} />
        </clipPath>
      </defs>

      <path d={cardPath} fill={`url(#${backgroundId})`} />

      <g clipPath={`url(#${clipId})`}>
        <circle cx="540" cy="532" r="430" fill={`url(#${ambientId})`} />
        <circle cx="540" cy="554" r="300" stroke={colors.accentStart} strokeOpacity="0.055" strokeWidth="2" />
        <circle cx="540" cy="554" r="220" stroke={colors.accentStart} strokeOpacity="0.045" strokeWidth="2" />
        <path d="M176 742C339 617 741 617 904 742" stroke={colors.detail} strokeOpacity="0.07" strokeWidth="3" />
        <path d="M190 800C370 690 710 690 890 800" stroke={colors.detail} strokeOpacity="0.04" strokeWidth="3" />
        <rect x="90" y="850" width="900" height="450" fill={`url(#${namePlateId})`} />
      </g>

      <path d={cardPath} stroke={`url(#${borderId})`} strokeWidth="8" />
      <path
        d="M154 92H926C949.196 92 968 110.804 968 134V1041.5C968 1074.65 948.895 1104.82 918.946 1119.05L561.469 1288.99C547.876 1295.45 532.124 1295.45 518.531 1288.99L161.054 1119.05C131.105 1104.82 112 1074.65 112 1041.5V134C112 110.804 130.804 92 154 92Z"
        stroke={colors.accentStart}
        strokeOpacity="0.28"
        strokeWidth="2"
      />

      <g transform="translate(442 124) scale(0.305)" fill="none" stroke={`url(#${logoId})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="256" cy="72" r="16" fill={colors.logoLight} />
        <circle cx="190" cy="128" r="11" fill={colors.logoLight} />
        <circle cx="322" cy="128" r="11" fill={colors.logoLight} />
        <circle cx="256" cy="164" r="11" fill={colors.logoLight} />
        <circle cx="150" cy="176" r="14" fill={colors.logoLight} />
        <circle cx="362" cy="176" r="14" fill={colors.logoLight} />
        <circle cx="256" cy="208" r="17" fill={colors.logoLight} />
        <path d="M256 88L190 128L150 176M256 88L322 128L362 176M190 128L256 164L322 128M150 176L256 208L362 176M190 128L256 208M322 128L256 208M256 88V208" />
        <path d="M150 190L116 260M150 190L184 260M362 190L328 260M362 190L396 260" />
        <path d="M104 260H196M316 260H408M108 260Q150 304 192 260M320 260Q362 304 404 260" />
        <path d="M256 226L232 374H280L256 226Z" fill={`url(#${logoId})`} />
        <path d="M212 400H300M188 428H324M172 448H340" />
      </g>

      <text x="540" y="302" textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize="54" fontWeight="800" letterSpacing="-1">
        <tspan fill={colors.accentStart}>Play</tspan>
        <tspan fill="#FFFFFF">Balance</tspan>
      </text>
      <rect x="390" y="1128" width="300" height="5" rx="2.5" fill={`url(#${borderId})`} />
    </svg>
  )
}
