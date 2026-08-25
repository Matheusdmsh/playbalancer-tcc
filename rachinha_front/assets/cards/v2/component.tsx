import { PlayBalanceOriginalCard } from "@/assets/cards/playbalance-original-card"

type CardProps = {
  photoUrl: string
  className?: string
}

export default function SvgCardV2({ photoUrl, className }: CardProps) {
  return <PlayBalanceOriginalCard photoUrl={photoUrl} className={className} palette="blue" />
}
