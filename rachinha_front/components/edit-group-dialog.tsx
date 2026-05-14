"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Image from "next/image"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { editGroup, Group, GroupUpdateData } from "@/services/groups"
import { uploadGroupImage } from "@/services/storageService"
import { ImageCropModal } from "@/components/ImageCropModal"

interface EditGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  onGroupUpdated: (updatedGroup: Group) => void
}

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }).max(100),
  modality: z.string().optional(),
  photo: z.instanceof(File).optional(),
  photo_url: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const sports = [
  'Futebol', 'Vôlei', 'Basquete', 'Futsal', 'Beach Tennis',
  'Tênis', 'Padel', 'Handebol', 'Outros'
];

export function EditGroupDialog({ open, onOpenChange, group, onGroupUpdated }: EditGroupDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [imagePreview, setImagePreview] = useState<string | null>(group.photo_url || null);

  // Estados para o modal de corte
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group.name,
      modality: group.modality || "",
      photo_url: group.photo_url || "",
    },
  })

  useEffect(() => {
    form.reset({
      name: group.name,
      modality: group.modality || "",
      photo_url: group.photo_url || "",
    });
    setImagePreview(group.photo_url || null);
    setCroppedImageFile(null);
  }, [group, form, open])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      const updatedData: GroupUpdateData = {
        name: data.name,
        modality: data.modality || null,
      };

      const photoFile = croppedImageFile || data.photo;
      if (photoFile) {
        toast({ title: "Enviando nova imagem..." });
        const imageUrl = await uploadGroupImage(photoFile, group._id);
        updatedData.photo_url = imageUrl;
      }

      const updatedGroup = await editGroup(group._id, updatedData)
      toast({
        title: "Turma atualizada!",
        description: `A turma "${updatedGroup.name}" foi atualizada com sucesso.`,
      })
      onGroupUpdated(updatedGroup)
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Erro ao editar turma",
        description: error.message || "Não foi possível atualizar a turma. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: File) => {
    form.setValue("photo", croppedImage);
    setCroppedImageFile(croppedImage);
    setImagePreview(URL.createObjectURL(croppedImage));
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Editar Turma</DialogTitle>
            <DialogDescription>
              Altere as informações da sua turma.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nome da Turma</Label>
                    <FormControl>
                      <Input placeholder="Ex: Racha de Terça" {...field} className="bg-zinc-800 border-zinc-700" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modality"
                render={({ field }) => (
                  <FormItem>
                    <Label>Modalidade</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Selecione um esporte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        {sports.map(sport => <SelectItem key={sport} value={sport}>{sport}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="photo-upload-edit">Alterar Foto da Turma</Label>
                    {imagePreview && (
                      <div className="mt-2 flex justify-center">
                        <Image src={imagePreview} alt="Pré-visualização da turma" width={80} height={80} className="rounded-full object-cover" />
                      </div>
                    )}
                    <FormControl>
                      <Input
                        id="photo-upload-edit"
                        type="file"
                        accept="image/*"
                        className="bg-zinc-800 border-zinc-700 file:text-white"
                        onChange={handlePhotoChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-500 hover:bg-green-600" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </>
  )
}