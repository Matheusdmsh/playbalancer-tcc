import { PlayBalanceOriginalCard } from "@/assets/cards/playbalance-original-card"

type CardProps = {
  className?: string
}

export default function SvgCardV1({ className }: CardProps) {
  return <PlayBalanceOriginalCard className={className} palette="green" />
}
