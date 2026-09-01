import { PlayBalanceOriginalCard } from "@/assets/cards/playbalance-original-card"

type CardProps = {
  className?: string
}

export default function SvgCardV2({ className }: CardProps) {
  return <PlayBalanceOriginalCard className={className} palette="blue" />
}
