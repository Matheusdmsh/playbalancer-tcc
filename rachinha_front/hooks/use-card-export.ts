import { RefObject } from "react"
import { useToast } from "@/components/ui/use-toast"

interface Sport {
  sport?: string
}

export const useCardExport = (exportCardRef: RefObject<HTMLDivElement>, currentSport: Sport | null) => {
  const { toast } = useToast()

  const exportCardAsImage = async () => {
    if (!exportCardRef.current) return

    try {
      const { domToPng } = await import("modern-screenshot")
      const dataUrl = await domToPng(exportCardRef.current, { backgroundColor: null })

      const link = document.createElement("a")
      const sportName = currentSport?.sport || "card"
      link.download = `rachinha-${sportName.toLowerCase().replace(/\s+/g, "-")}.png`
      link.href = dataUrl
      link.click()

      toast({
        title: "Card exportado!",
        description: "A imagem foi baixada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao exportar card:", error)
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar a imagem do card.",
        variant: "destructive",
      })
    }
  }

  const shareCard = async () => {
    if (!exportCardRef.current) return

    try {
      const { domToBlob } = await import("modern-screenshot")
      const blob = await domToBlob(exportCardRef.current, { backgroundColor: null })
      const file = new File([blob], "rachinha-card.png", { type: "image/png" })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Meu Card Rachinha",
          text: "Confira meu card no Rachinha!",
        })
      } else {
        await exportCardAsImage()
        return
      }

      toast({
        title: "Card compartilhado!",
        description: "Seu card foi compartilhado com sucesso.",
      })
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Erro ao compartilhar card:", error)
        toast({
          title: "Erro ao compartilhar",
          description: "Não foi possível compartilhar o card.",
          variant: "destructive",
        })
      }
    }
  }

  return { exportCardAsImage, shareCard }
}
