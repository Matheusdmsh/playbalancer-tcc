import { MdSportsSoccer, MdSportsVolleyball, MdSportsBasketball, MdSportsTennis, MdSportsHandball, MdFlag } from "react-icons/md"
import { IoTennisballOutline } from "react-icons/io5"

/**
 * Retorna o ícone Material Design baseado na modalidade do esporte
 * @param modality - Nome da modalidade (ex: "Futsal", "Tênis", "Vôlei")
 * @returns Componente React com o ícone
 */
export const getSportIcon = (modality?: string | null) => {
  const lower = modality?.toLowerCase() || ""
  
  // Futebol / Futsal
  if (lower.includes("futebol") || lower.includes("futsal")) {
    return <MdSportsSoccer className="h-6 w-6 text-green-400" />
  }
  
  // Vôlei / Beach Vôlei
  if (lower.includes("volei") || lower.includes("vôlei") || lower.includes("volleyball")) {
    return <MdSportsVolleyball className="h-6 w-6 text-green-400" />
  }
  
  // Basquete / Basketball
  if (lower.includes("basquete") || lower.includes("basketball")) {
    return <MdSportsBasketball className="h-6 w-6 text-green-400" />
  }
  
  // Beach Tennis (deve estar antes de Tennis)
  if (lower.includes("beach tennis")) {
    return <MdSportsTennis className="h-6 w-6 text-green-400" />
  }
  
  // Tênis / Tennis
  if (lower.includes("tennis") || lower.includes("tênis") || lower.includes("tenis")) {
    return <IoTennisballOutline className="h-6 w-6 text-green-400" />
  }
  
  // Handebol / Handball
  if (lower.includes("handebol") || lower.includes("handball")) {
    return <MdSportsHandball className="h-6 w-6 text-green-400" />
  }
  
  // Padel
  if (lower.includes("padel")) {
    return <IoTennisballOutline className="h-6 w-6 text-green-400" />
  }
  
  // Badminton
  if (lower.includes("badminton")) {
    return <IoTennisballOutline className="h-6 w-6 text-green-400" />
  }
  
  // Golf
  if (lower.includes("golf")) {
    return <MdFlag className="h-6 w-6 text-green-400" />
  }
  
  // Bowling
  if (lower.includes("bowling")) {
    return <MdSportsSoccer className="h-6 w-6 text-green-400" />
  }
  
  // Natação / Swimming
  if (lower.includes("swim") || lower.includes("natação")) {
    return <MdSportsSoccer className="h-6 w-6 text-green-400" />
  }
  
  // Default
  return <MdFlag className="h-6 w-6 text-green-400" />
}
