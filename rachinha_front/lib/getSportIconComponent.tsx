import React from "react"
import {
  Trophy,
  Wind,
  Dribbble,
  Flame,
  Hammer,
  Radio,
  Briefcase,
  Users,
  HelpCircle,
} from "lucide-react"

interface GetSportIconProps {
  sport: string
  className?: string
}

export function getSportIconComponent({ sport, className = "h-5 w-5" }: GetSportIconProps): React.ReactNode {
  const sportIcons: Record<string, React.ReactNode> = {
    "Futebol": <Trophy className={className} />,
    "Vôlei": <Wind className={className} />,
    "Basquete": <Dribbble className={className} />,
    "Futsal": <Flame className={className} />,
    "Beach Tennis": <Hammer className={className} />,
    "Tênis": <Radio className={className} />,
    "Padel": <Briefcase className={className} />,
    "Handebol": <Trophy className={className} />,
    "Outros": <HelpCircle className={className} />,
  }

  return sportIcons[sport] || sportIcons["Outros"]
}
