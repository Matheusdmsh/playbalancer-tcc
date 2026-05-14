"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea" // Importar o Textarea
import { useToast } from "@/components/ui/use-toast"
import { Building, ChevronLeft, Info, Upload, Search } from "lucide-react"
import { getCurrentUser, updateUserRole } from "@/services/users"
import { createArena } from "@/services/arena"
import { uploadArenaImage } from "@/services/storageService"
import { User } from "@/interface/users"
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// Zod schema for form validation with detailed address
const formSchema = z.object({
  arenaName: z.string().min(3, { message: "O nome da arena deve ter pelo menos 3 caracteres." }),
  description: z.string().max(500, { message: "A descrição não pode ter mais de 500 caracteres." }).optional(), // <-- CAMPO ADICIONADO
  photos: z.array(z.instanceof(File)).optional(),
  lat: z.number({ required_error: "Selecione a localização no mapa." }),
  lng: z.number({ required_error: "Selecione a localização no mapa." }),
  
  // Detailed address fields
  street: z.string().min(3, { message: "A rua é obrigatória." }),
  neighborhood: z.string().min(3, { message: "O bairro é obrigatório." }),
  city: z.string().min(3, { message: "A cidade é obrigatória." }),
  state: z.string().min(2, { message: "O estado é obrigatório." }),
  uf: z.string().length(2, { message: "UF deve ter 2 caracteres." }),
  cep: z.string().min(8, { message: "O CEP deve ter 8 dígitos." }),
  complementary: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function RentOutYourCourtPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [mapCenter, setMapCenter] = useState<[number, number]>([-19.747, -47.938])
  
  const MapWithNoSSR = useMemo(() => dynamic(() => import('@/components/map-picker'), {
    ssr: false,
    loading: () => <p className="flex items-center justify-center h-full">Carregando mapa...</p>
  }), [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      arenaName: "",
      description: "", // <-- VALOR PADRÃO
      photos: [],
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      uf: "",
      cep: "",
      complementary: "",
    },
  })

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.error("Erro ao obter geolocalização:", error);
        toast({
          title: "Localização não permitida",
          description: "Usando localização padrão. Você pode buscar pelo endereço.",
        })
      }
    );
  }, [toast]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        toast({
          title: "Você não está logado",
          description: "Faça login para anunciar seu espaço.",
          variant: "destructive",
        })
        router.push("/login")
      }
    }
    fetchUser()
  }, [router, toast])

  const handleBecomeAdmin = async () => {
    setIsLoading(true)
    try {
      await updateUserRole("admin")
      const updatedUser = await getCurrentUser()
      setUser(updatedUser)
      toast({
        title: "Parabéns!",
        description: "Você agora é um administrador. Cadastre sua primeira arena.",
      })
    } catch (error) {
      toast({
        title: "Erro ao se tornar administrador",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files))
    }
  }

  const handleLocationSelect = useCallback(async (latlng: { lat: number, lng: number }) => {
    form.setValue("lat", latlng.lat);
    form.setValue("lng", latlng.lng);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      
      if (data.address) {
        const addr = data.address;
        const uf = (addr['ISO3166-2-lvl4'] || '').split('-')[1] || '';

        form.setValue("street", addr.road || '');
        form.setValue("neighborhood", addr.suburb || '');
        form.setValue("city", addr.city || addr.town || '');
        form.setValue("state", addr.state || '');
        form.setValue("uf", uf);
        form.setValue("cep", (addr.postcode || '').replace('-', ''));
      }
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
      toast({
          title: "Erro ao buscar endereço",
          description: "Não foi possível obter os detalhes do endereço para o local selecionado.",
          variant: "destructive",
      });
    }
  }, [form, toast]);

  const handleAddressSearch = async () => {
    const query = searchInput.trim();
    if (query.length < 3) {
      toast({
        title: "Busca muito curta",
        description: "Digite pelo menos 3 caracteres para buscar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`);
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setMapCenter(newCenter);
        handleLocationSelect({ lat: newCenter[0], lng: newCenter[1] });
      } else {
        toast({ title: "Endereço não encontrado", description: "Não foi possível encontrar uma localização para a sua busca.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
      toast({ title: "Erro na busca", description: "Ocorreu um erro ao tentar buscar o endereço.", variant: "destructive" });
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    setIsLoading(true)
    try {
      const photoUrls = await Promise.all(
        selectedFiles.map((file) => uploadArenaImage(file, user.id))
      )

      await createArena({
        name: data.arenaName,
        description: data.description, // <-- CAMPO ENVIADO
        is_active: true,
        photos_url: photoUrls,
        location: {
            latitude: data.lat,
            longitude: data.lng,
            street: data.street,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            uf: data.uf,
            cep: data.cep,
            complementary: data.complementary
        },
      })

      toast({
        title: "Arena criada com sucesso!",
        description: "Sua arena foi cadastrada e já está pronta para receber reservas.",
      })
      router.push("/admin")
    } catch (error) {
      toast({
        title: "Erro ao criar arena",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div className="flex h-screen items-center justify-center bg-black text-white">Carregando...</div>
  }

  return (
    <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <div className="flex items-center gap-3 mb-8">
                <Building className="h-8 w-8 text-green-500" />
                <h1 className="text-3xl font-bold">Anuncie seu espaço esportivo</h1>
              </div>
              <p className="text-zinc-400 max-w-2xl">
                Cadastre sua arena ou quadra esportiva e comece a receber reservas. Gerencie seu espaço, disponibilidade e clientes em um só lugar.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle>
                      {user.role.includes("admin") ? "Cadastrar Nova Arena" : "Torne-se um Administrador"}
                    </CardTitle>
                    <CardDescription>
                      {user.role.includes("admin")
                        ? "Preencha os dados da sua primeira arena para começar a gerenciar."
                                                : "Para anunciar seu espaço, você precisa de permissões de administrador."}
                    </CardDescription>
                  </CardHeader>

                  {user.role.includes("admin") ? (
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="arenaName">Nome da Arena</Label>
                          <Input id="arenaName" className="bg-zinc-800 border-zinc-700" {...form.register("arenaName")} />
                          {form.formState.errors.arenaName && <p className="text-sm text-red-500">{form.formState.errors.arenaName.message}</p>}
                        </div>
                        {/* CAMPO DE DESCRIÇÃO ADICIONADO */}
                        <div className="space-y-2">
                          <Label htmlFor="description">Descrição (Opcional)</Label>
                          <Textarea
                            id="description"
                            placeholder="Descreva sua arena, tipos de quadra, comodidades, etc."
                            className="bg-zinc-800 border-zinc-700"
                            {...form.register("description")}
                          />
                          {form.formState.errors.description && <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Fotos da Arena (opcional)</Label>
                          <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-700">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-zinc-400" />
                                <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                                <p className="text-xs text-zinc-500">SVG, PNG, JPG ou GIF (MAX. 5MB)</p>
                              </div>
                              <Input id="dropzone-file" type="file" className="hidden" multiple onChange={handleFileChange} />
                            </label>
                          </div>
                          {selectedFiles.length > 0 && <div className="mt-2 text-sm text-zinc-400">{selectedFiles.length} arquivo(s) selecionado(s).</div>}
                        </div>

                        <div className="space-y-4">
                          <Label>Localização</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              placeholder="Buscar por Endereço ou CEP" 
                              value={searchInput}
                              onChange={(e) => setSearchInput(e.target.value)}
                              className="bg-zinc-800 border-zinc-700"
                            />
                            <Button type="button" onClick={handleAddressSearch} size="icon" className="bg-green-500 hover:bg-green-600 shrink-0">
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="h-96 w-full rounded-md overflow-hidden bg-zinc-800">
                            <MapWithNoSSR 
                              onLocationSelect={handleLocationSelect}
                              center={mapCenter}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="street">Rua</Label>
                                <Input id="street" {...form.register("street")} className="bg-zinc-800 border-zinc-700"/>
                                {form.formState.errors.street && <p className="text-sm text-red-500">{form.formState.errors.street.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input id="neighborhood" {...form.register("neighborhood")} className="bg-zinc-800 border-zinc-700"/>
                                {form.formState.errors.neighborhood && <p className="text-sm text-red-500">{form.formState.errors.neighborhood.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">Cidade</Label>
                                <Input id="city" {...form.register("city")} className="bg-zinc-800 border-zinc-700"/>
                                {form.formState.errors.city && <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="uf">UF</Label>
                                <Input id="uf" {...form.register("uf")} className="bg-zinc-800 border-zinc-700"/>
                                {form.formState.errors.uf && <p className="text-sm text-red-500">{form.formState.errors.uf.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cep">CEP</Label>
                                <Input id="cep" {...form.register("cep")} className="bg-zinc-800 border-zinc-700"/>
                                {form.formState.errors.cep && <p className="text-sm text-red-500">{form.formState.errors.cep.message}</p>}
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="complementary">Complemento (Opcional)</Label>
                            <Input id="complementary" {...form.register("complementary")} className="bg-zinc-800 border-zinc-700"/>
                        </div>

                      </CardContent>

                      <CardFooter>
                        <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={isLoading}>
                          {isLoading ? "Cadastrando..." : "Cadastrar Arena"}
                        </Button>
                      </CardFooter>
                    </form>
                  ) : (
                    <CardFooter>
                      <Button onClick={handleBecomeAdmin} className="w-full bg-green-500 hover:bg-green-600" disabled={isLoading}>
                        {isLoading ? "Processando..." : "Tornar-se Administrador"}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                </div>
                <div className="hidden md:block">
                  <Card className="bg-zinc-900 border-zinc-800 sticky top-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-green-500" />
                        Benefícios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-black font-bold shrink-0 mt-0.5">1</div>
                          <div>
                            <p className="font-medium">Gerencie suas quadras</p>
                            <p className="text-sm text-zinc-400">Cadastre todas as suas quadras e defina preços, horários e disponibilidade.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-black font-bold shrink-0 mt-0.5">2</div>
                          <div>
                            <p className="font-medium">Receba reservas online</p>
                            <p className="text-sm text-zinc-400">Seus clientes podem reservar e pagar diretamente pela plataforma.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-black font-bold shrink-0 mt-0.5">3</div>
                          <div>
                            <p className="font-medium">Aumente sua visibilidade</p>
                            <p className="text-sm text-zinc-400">Apareça nas buscas e atraia novos clientes para seu espaço.</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-black font-bold shrink-0 mt-0.5">4</div>
                          <div>
                            <p className="font-medium">Relatórios e estatísticas</p>
                            <p className="text-sm text-zinc-400">Acompanhe o desempenho do seu negócio com relatórios detalhados.</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
            </div>
        </div>
    </div>
  )
}