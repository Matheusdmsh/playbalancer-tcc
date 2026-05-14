"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Search, MapPin, Loader2, Save } from "lucide-react"
import { Arena, ArenaCreate, ArenaUpdate } from "@/interface/arena"
import { createArena, editArena } from "@/services/arena"
import { getUserDataFromToken } from "@/services/users"
import 'leaflet/dist/leaflet.css'

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome da arena deve ter pelo menos 3 caracteres." }),
  description: z.string().max(500, { message: "A descrição não pode ter mais de 500 caracteres." }).optional(),
  street: z.string().min(3, { message: "A rua é obrigatória." }),
  neighborhood: z.string().min(3, { message: "O bairro é obrigatório." }),
  city: z.string().min(3, { message: "A cidade é obrigatória." }),
  state: z.string().min(3, { message: "O estado é obrigatório." }),
  uf: z.string().length(2, { message: "UF deve ter 2 caracteres." }),
  cep: z.string().min(8, { message: "O CEP deve ter 8 dígitos." }),
  complementary: z.string().optional(),
  lat: z.number({ message: "Selecione a localização no mapa." }),
  lng: z.number({ message: "Selecione a localização no mapa." }),
});
type FormValues = z.infer<typeof formSchema>;

interface ArenaFormProps {
  arena?: Arena | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ArenaForm({ arena, onSuccess, onCancel }: ArenaFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-19.747, -47.938]);
  const [hasLocation, setHasLocation] = useState(false);

  const MapWithNoSSR = useMemo(() => dynamic(() => import('@/components/map-picker'), {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-zinc-800/50 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-green-400" />
      </div>
    )
  }), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: arena?.name || "",
      description: arena?.description || "",
      street: arena?.location.street || "",
      neighborhood: arena?.location.neighborhood || "",
      city: arena?.location.city || "",
      state: arena?.location.state || "",
      uf: arena?.location.uf || "",
      cep: arena?.location.cep || "",
      complementary: arena?.location.complementary || "",
      lat: arena?.location.latitude,
      lng: arena?.location.longitude,
    },
  });

  useEffect(() => {
    if (arena?.location.latitude && arena.location.longitude) {
      setMapCenter([arena.location.latitude, arena.location.longitude]);
      setHasLocation(true);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (position) => setMapCenter([position.coords.latitude, position.coords.longitude]),
        () => console.error("Não foi possível obter a geolocalização.")
      );
    }
  }, [arena]);

  const handleLocationSelect = useCallback(async (latlng: { lat: number, lng: number }) => {
    form.setValue("lat", latlng.lat);
    form.setValue("lng", latlng.lng);
    setHasLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      if (data.address) {
        const addr = data.address;
        const uf = (addr['ISO3166-2-lvl4'] || '').split('-')[1] || '';
        form.setValue("street", addr.road || '');
        form.setValue("neighborhood", addr.suburb || addr.neighbourhood || '');
        form.setValue("city", addr.city || addr.town || addr.municipality || '');
        form.setValue("state", addr.state || '');
        form.setValue("uf", uf);
        form.setValue("cep", (addr.postcode || '').replace('-', '').replace(/\D/g, ''));
      }
    } catch (error) { console.error("Erro ao buscar endereço:", error); }
  }, [form]);

  const handleAddressSearch = async () => {
    const query = searchInput.trim();
    if (query.length < 3) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`);
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setMapCenter(newCenter);
        await handleLocationSelect({ lat: newCenter[0], lng: newCenter[1] });
      } else {
        toast({ title: "Endereço não encontrado", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro ao buscar endereço", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const userData = getUserDataFromToken();
      if (!userData || !userData.sub) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      const payload: ArenaCreate | ArenaUpdate = {
        name: data.name,
        description: data.description,
        is_active: true,
        photos_url: arena?.photos_url || [],
        location: {
          latitude: data.lat, longitude: data.lng, street: data.street,
          neighborhood: data.neighborhood, city: data.city, state: data.state,
          uf: data.uf, cep: data.cep, complementary: data.complementary,
          alt: data.street ? `${data.street}, ${data.city}` : undefined,
        },
      };

      if (arena) {
        await editArena(arena.id, payload);
        toast({ title: "Arena atualizada com sucesso!" });
      } else {
        await createArena(payload as ArenaCreate);
        toast({ title: "Arena criada com sucesso!" });
      }
      onSuccess();
    } catch (error) {
      toast({ title: "Erro ao salvar arena", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-zinc-300">Nome da Arena</Label>
        <Input id="name" {...form.register("name")} className="bg-zinc-800/60 border-zinc-700 focus:border-green-500 transition-colors" placeholder="Ex: Arena Central" />
        {form.formState.errors.name && <p className="text-sm text-red-400">{form.formState.errors.name.message}</p>}
      </div>
      
      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-zinc-300">Descrição (Opcional)</Label>
        <Textarea id="description" {...form.register("description")} className="bg-zinc-800/60 border-zinc-700 focus:border-green-500 transition-colors resize-none" rows={3} placeholder="Descreva sua arena..." />
        {form.formState.errors.description && <p className="text-sm text-red-400">{form.formState.errors.description.message}</p>}
      </div>

      {/* Localização */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-green-400" />
          Localização no Mapa
        </Label>
        
        {/* Busca de endereço */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Pesquise por endereço ou CEP..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
            className="bg-zinc-800/60 border-zinc-700 focus:border-green-500 transition-colors"
          />
          <Button
            type="button"
            onClick={handleAddressSearch}
            size="icon"
            disabled={isSearching}
            className="bg-green-500 hover:bg-green-600 shrink-0"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mapa */}
        <div className="h-64 w-full rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
          <MapWithNoSSR onLocationSelect={handleLocationSelect} center={mapCenter} />
        </div>

        {hasLocation && (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>Localização selecionada no mapa</span>
          </div>
        )}
        {form.formState.errors.lat && <p className="text-sm text-red-400">{form.formState.errors.lat.message}</p>}
      </div>

      {/* Campos de endereço preenchidos automaticamente */}
      <div className="space-y-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Endereço (preenchido automaticamente)</p>
        <div className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="street" className="text-xs text-zinc-400">Rua</Label>
              <Input id="street" {...form.register("street")} className="bg-zinc-800/40 border-zinc-700 text-sm" />
              {form.formState.errors.street && <p className="text-xs text-red-400">{form.formState.errors.street.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="neighborhood" className="text-xs text-zinc-400">Bairro</Label>
              <Input id="neighborhood" {...form.register("neighborhood")} className="bg-zinc-800/40 border-zinc-700 text-sm" />
              {form.formState.errors.neighborhood && <p className="text-xs text-red-400">{form.formState.errors.neighborhood.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="city" className="text-xs text-zinc-400">Cidade</Label>
              <Input id="city" {...form.register("city")} className="bg-zinc-800/40 border-zinc-700 text-sm" />
              {form.formState.errors.city && <p className="text-xs text-red-400">{form.formState.errors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf" className="text-xs text-zinc-400">UF</Label>
              <Input id="uf" {...form.register("uf")} maxLength={2} className="bg-zinc-800/40 border-zinc-700 text-sm uppercase" />
              {form.formState.errors.uf && <p className="text-xs text-red-400">{form.formState.errors.uf.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cep" className="text-xs text-zinc-400">CEP</Label>
              <Input id="cep" {...form.register("cep")} className="bg-zinc-800/40 border-zinc-700 text-sm" />
              {form.formState.errors.cep && <p className="text-xs text-red-400">{form.formState.errors.cep.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complementary" className="text-xs text-zinc-400">Complemento</Label>
              <Input id="complementary" {...form.register("complementary")} className="bg-zinc-800/40 border-zinc-700 text-sm" placeholder="Opcional" />
            </div>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel} className="flex-1 border-zinc-700 hover:bg-zinc-800">
            Cancelar
          </Button>
        )}
        <Button className="flex-1 bg-green-500 hover:bg-green-600 gap-2" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isLoading ? "Salvando..." : arena ? "Salvar Alterações" : "Criar Arena"}
        </Button>
      </div>
    </form>
  );
}