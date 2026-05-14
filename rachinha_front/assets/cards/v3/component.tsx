import { UserProfileCardColorSet } from "./types"

interface SvgCardV3Props {
	colorSet: UserProfileCardColorSet
	idPrefix?: string
	strokeWidth?: number
	showOuterBorder?: boolean
}

const RAW_VIEWBOX = "0 0 810 1012.5"

const CARD_PATH =
	"M 80.933594 62.789062 L 80.933594 798.769531 C 80.933594 814.773438 90.214844 829.320312 104.726562 836.0625 L 380.914062 964.394531 C 396.003906 971.402344 413.414062 971.402344 428.503906 964.394531 L 704.691406 836.0625 C 719.203125 829.320312 728.484375 814.773438 728.484375 798.769531 L 728.484375 62.789062 C 728.484375 55.828125 725.722656 49.15625 720.800781 44.234375 C 715.878906 39.316406 709.207031 36.550781 702.25 36.550781 L 107.171875 36.550781 C 100.210938 36.550781 93.539062 39.316406 88.617188 44.234375 C 83.699219 49.15625 80.933594 55.828125 80.933594 62.789062 Z"

const INNER_PATH =
	"M 101.6875 82.605469 L 101.6875 624.589844 C 101.6875 640.253906 111.726562 654.152344 126.59375 659.082031 L 379.804688 743.027344 C 395.976562 748.390625 413.445312 748.390625 429.613281 743.027344 L 682.828125 659.082031 C 697.695312 654.152344 707.730469 640.253906 707.730469 624.589844 L 707.730469 82.605469 C 707.730469 75.648438 704.964844 68.976562 700.046875 64.054688 C 695.125 59.132812 688.453125 56.371094 681.492188 56.371094 L 127.925781 56.371094 C 120.96875 56.371094 114.292969 59.132812 109.371094 64.054688 C 104.453125 68.976562 101.6875 75.648438 101.6875 82.605469 Z"

const FOOTER_PATH =
	"M 81.289062 679.476562 L 81.289062 798.769531 C 81.289062 814.773438 90.570312 829.320312 105.082031 836.0625 L 381.269531 964.394531 C 396.359375 971.402344 413.769531 971.402344 428.859375 964.394531 L 705.046875 836.0625 C 719.558594 829.320312 728.839844 814.773438 728.839844 798.769531 L 728.839844 679.476562 C 728.839844 672.515625 726.074219 665.84375 721.15625 660.921875 C 716.234375 656 709.5625 653.238281 702.601562 653.238281 L 107.523438 653.238281 C 100.566406 653.238281 93.894531 656 88.972656 660.921875 C 84.050781 665.84375 81.289062 672.515625 81.289062 679.476562 Z"

const TOP_BANNER_PATH =
	"M 260.246094 49.324219 L 549.175781 49.324219 L 496.527344 89.546875 L 312.890625 89.546875 Z"

const GLOSS_PANEL_PATH =
	"M 101.6875 82.605469 L 101.6875 624.589844 C 101.6875 640.253906 111.726562 654.152344 126.59375 659.082031 L 379.804688 743.027344 C 395.976562 748.390625 413.445312 748.390625 429.613281 743.027344 L 682.828125 659.082031 C 697.695312 654.152344 707.730469 640.253906 707.730469 624.589844 L 707.730469 82.605469 C 707.730469 75.648438 704.964844 68.976562 700.046875 64.054688 C 695.125 59.132812 688.453125 56.371094 681.492188 56.371094 L 127.925781 56.371094 C 120.96875 56.371094 114.292969 59.132812 109.371094 64.054688 C 104.453125 68.976562 101.6875 75.648438 101.6875 82.605469 Z"

const BRAND_LOGO_PATH =
	"M355.63 80.9739C355.458 77.4375 355.031 73.9219 354.677 70.401C354.469 68.6354 354.187 66.8802 353.953 65.1302C353.724 63.3646 353.453 61.6146 353.12 59.8698C351.979 52.8437 350.333 45.8906 348.568 38.9479C346.271 30.5833 343.547 22.3125 340.448 14.1406C338.687 18.8125 336.844 23.4062 335.021 27.9375L331.969 36.3125L324.844 30.4844C314.547 22.0521 302.885 15.4479 290.479 10.7292C278.057 6.00519 264.922 3.14061 251.589 1.70311C238.234 0.270818 224.677 0.265611 211.146 1.21353C202.797 1.80207 194.458 2.76561 186.135 4.02082L195.406 17.5677L203.297 28.9271L190.115 32.0052C169.88 36.7396 149.964 43.0885 130.75 51.25C111.5 59.3594 92.8698 69.0469 75.0052 80.0833C57.1302 91.1146 39.9948 103.422 23.526 116.651C15.5521 123.062 7.72916 129.682 0.0104065 136.448L111.922 82.7344L105.042 99.9635C105.042 99.9635 151.219 80.6198 190.141 76.7917C223.458 73.5156 251.995 83.2187 235.635 108.13C235.411 108.469 235.25 108.854 235.047 109.203C235.021 109.245 235 109.281 234.984 109.318H234.974C234.021 110.937 232.964 112.443 231.849 113.885C225.328 122.026 217.432 128.203 209.385 134.021C205.333 136.896 201.203 139.62 196.995 142.245C192.745 144.859 188.583 147.37 183.969 149.802L173.938 154.333L176.281 143.536C177.505 137.865 179.208 132.214 180.953 126.906C181.245 126.026 181.516 125.151 181.786 124.281C179.271 125.786 176.776 127.286 174.292 128.802C168.099 132.604 162.109 136.625 156.359 140.865C144.792 149.286 134.333 158.891 125.302 169.49C120.797 174.807 116.693 180.411 113.031 186.271C109.359 192.109 106.083 198.182 103.276 204.458L101.276 209.203C100.615 210.786 100.047 212.417 99.4323 214.016C98.7917 215.609 98.3125 217.266 97.75 218.896L96.9375 221.344L96.3073 223.583C94.7292 229.578 94.1979 235.458 94.9167 240.995C95.6406 246.536 97.6094 251.734 100.661 256.604C103.75 261.443 107.932 265.896 112.828 269.854C122.292 277.536 134.307 283.448 146.422 287.26C127.104 277.786 119.078 263.635 116.531 249.766C105.896 220.49 137.115 177.208 158.198 157.651C160.516 171.521 161.562 179.13 161.562 179.13C161.562 179.13 275.948 128.776 260.042 84.6302C244.74 42.1823 169.214 57.0833 136.552 61.6823C175.974 39.901 233.349 40.1771 233.349 40.1771C233.349 40.1771 230.729 33.5625 218.599 22.8281C273.37 24.776 306.271 47.0052 320.562 78.0104L328.995 56.9844C341.724 102.354 323.734 154.208 323.734 154.208L323.724 154.198C315.625 182.505 298.344 211.104 273.25 235.13C262.542 245.385 247.089 255.891 229.74 264.01C289.052 210.661 334.219 50.5677 228.646 49.1667C301.495 69.2864 277.656 147.849 226.859 175.047C192.328 193.526 174.979 215.057 168.375 233.875C168.203 234.385 168.036 234.88 167.885 235.38C159.083 264.203 187.146 290.901 215.724 281.323C219.104 280.182 222.469 278.953 225.797 277.625C251.589 267.255 275.578 251.672 295.656 232.151C315.693 212.609 332.182 189.286 342.589 163.349C347.734 150.38 351.682 136.896 353.792 123.042C354.391 119.589 354.74 116.099 355.156 112.62C355.422 109.12 355.76 105.62 355.849 102.104C356.057 98.5989 356.021 95.0729 356.062 91.5469C355.948 88.026 355.932 84.5 355.63 80.9739Z"

export function SvgCardV3Base({ colorSet, idPrefix = "v3" }: SvgCardV3Props) {
	const backgroundGradientId = `${idPrefix}-background`
	const footerGradientId = `${idPrefix}-footer`
	const topGradientId = `${idPrefix}-top`
	const glowGradientId = `${idPrefix}-glow`
	const glossGradientId = `${idPrefix}-gloss`
	const glossHighlightId = `${idPrefix}-gloss-highlight`

	return (
		<svg
			className="absolute inset-0 h-full w-full"
			viewBox={RAW_VIEWBOX}
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id={backgroundGradientId} x1="50%" y1="0%" x2="50%" y2="100%">
					<stop offset="0%" stopColor={colorSet.greenStart} />
					<stop offset="48%" stopColor={colorSet.greenMid} />
					<stop offset="100%" stopColor={colorSet.greenEnd} />
				</linearGradient>
				<linearGradient id={footerGradientId} x1="50%" y1="0%" x2="50%" y2="100%">
					<stop offset="0%" stopColor="#112638" />
					<stop offset="100%" stopColor="#08111d" />
				</linearGradient>
				<linearGradient id={topGradientId} x1="0%" y1="50%" x2="100%" y2="50%">
					<stop offset="0%" stopColor="#0a121c" />
					<stop offset="52%" stopColor="#12283a" />
					<stop offset="100%" stopColor="#08111d" />
				</linearGradient>
				<radialGradient id={glowGradientId} cx="50%" cy="22%" r="58%">
					<stop offset="0%" stopColor="rgba(130, 210, 255, 0.2)" />
					<stop offset="100%" stopColor="rgba(130, 210, 255, 0)" />
				</radialGradient>
				<linearGradient id={glossGradientId} x1="50%" y1="0%" x2="50%" y2="100%">
					<stop offset="0%" stopColor="rgba(200, 242, 255, 0.34)" />
					<stop offset="28%" stopColor="rgba(180, 232, 255, 0.2)" />
					<stop offset="56%" stopColor="rgba(150, 215, 245, 0.1)" />
					<stop offset="100%" stopColor="rgba(150, 215, 245, 0.02)" />
				</linearGradient>
				<radialGradient id={glossHighlightId} cx="50%" cy="10%" r="70%">
					<stop offset="0%" stopColor="rgba(240, 251, 255, 0.24)" />
					<stop offset="42%" stopColor="rgba(210, 240, 255, 0.08)" />
					<stop offset="100%" stopColor="rgba(210, 240, 255, 0)" />
				</radialGradient>
			</defs>

			<path d={CARD_PATH} fill={`url(#${backgroundGradientId})`} />
			<path d={GLOSS_PANEL_PATH} fill={`url(#${glossGradientId})`} opacity="0.95" />
			<path d={GLOSS_PANEL_PATH} fill={`url(#${glossHighlightId})`} opacity="0.8" />
			<rect x="102" y="92" width="606" height="590" fill={`url(#${glowGradientId})`} opacity="0.55" />
			<path d={FOOTER_PATH} fill={`url(#${footerGradientId})`} />
			<path d={TOP_BANNER_PATH} fill={`url(#${topGradientId})`} />
		</svg>
	)
}

export function SvgCardV3Border({
	colorSet,
	idPrefix = "v3",
	strokeWidth = 2.5,
	showOuterBorder = true,
}: SvgCardV3Props) {
	const borderGradientId = `${idPrefix}-border`

	return (
		<svg
			className="absolute inset-0 h-full w-full"
			viewBox={RAW_VIEWBOX}
			preserveAspectRatio="none"
			aria-hidden="true"
			style={{ zIndex: 3 }}
		>
			<defs>
				<linearGradient id={borderGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor={colorSet.borderStart} />
					<stop offset="50%" stopColor={colorSet.borderMid} />
					<stop offset="100%" stopColor={colorSet.borderEnd} />
				</linearGradient>
			</defs>

			{showOuterBorder && (
				<path
					d={CARD_PATH}
					fill="none"
					stroke={`url(#${borderGradientId})`}
					strokeWidth={strokeWidth + 1}
					strokeLinejoin="round"
				/>
			)}

			<path
				d={INNER_PATH}
				fill="none"
				stroke={`url(#${borderGradientId})`}
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				opacity="0.95"
			/>

			<path
				d={FOOTER_PATH}
				fill="none"
				stroke={`url(#${borderGradientId})`}
				strokeWidth={strokeWidth}
				strokeLinejoin="round"
				opacity="0.8"
			/>

			{/* Branding: logo icon + RACHINHA.COM no banner superior */}
			<g transform="translate(293, 57.67) scale(0.078652)">
				<path d={BRAND_LOGO_PATH} fill={colorSet.accent} />
			</g>
			<text
				x="331"
				y="69"
				fill={colorSet.accent}
				fontSize="22"
				fontWeight="700"
				fontFamily="Arial, sans-serif"
				letterSpacing="3"
				textLength="185"
				lengthAdjust="spacingAndGlyphs"
				dominantBaseline="central"
			>
				RACHINHA.COM
			</text>
		</svg>
	)
}
