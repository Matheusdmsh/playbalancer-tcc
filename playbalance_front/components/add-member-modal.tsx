// components/add-member-modal.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { searchUsers, UserSearchResult, createGhostUser } from "@/services/users";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { addMemberToGroup } from "@/services/groups";
import { Loader2, UserPlus, Ghost } from "lucide-react";
import { Separator } from "./ui/separator";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: (newMember: UserSearchResult) => void;
  groupId: string;
}

const getInitials = (name: string = "") => {
  const names = name.split(' ');
  return (names[0]?.[0] || '') + (names.length > 1 ? names[names.length - 1]?.[0] : '');
};

export function AddMemberModal({ isOpen, onClose, onMemberAdded, groupId }: AddMemberModalProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  // --- LÓGICA DE DEBOUNCE ---
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery)
        .then(results => {
          setSearchResults(results);
        })
        .catch(error => {
          toast({ title: "Erro na busca", description: error.message, variant: "destructive" });
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 500);

    return () => clearTimeout(debounceTimer);

  }, [searchQuery, toast]);

  const handleAddMember = async (user: UserSearchResult) => {
    setIsAdding(user.id);
    try {
      // Usar _id que é o ID do MongoDB
      await addMemberToGroup(groupId, user._id, 0);
      toast({ title: "Sucesso!", description: `${user.name} foi adicionado à turma.` });
      onMemberAdded(user);
      handleOnClose();
    } catch (error: any) {
      toast({ title: "Erro ao adicionar membro", description: error.message, variant: "destructive" });
    } finally {
        setIsAdding(null);
    }
  };
  
  const handleAddGhostMember = async () => {
    setIsAdding("ghost");
    try {
      // 1. Cria o usuário fantasma
      const ghostUser = await createGhostUser(searchQuery);
      console.log("Usuário fantasma criado:", ghostUser);
      // 2. Adiciona o usuário recém-criado ao grupo
      await addMemberToGroup(groupId, ghostUser.id, 0);
      console.log("Usuário fantasma adicionado ao grupo:", groupId);
      
      toast({ title: "Sucesso!", description: `${ghostUser.name} foi adicionado como jogador fantasma.` });
      onMemberAdded(ghostUser);
      handleOnClose();
    } catch (error: any) {
      toast({ title: "Erro ao criar membro fantasma", description: error.message, variant: "destructive" });
      setIsAdding(null);
    }
  };

  const handleOnClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setIsAdding(null);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOnClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Membro</DialogTitle>
          <DialogDescription>
            Digite o nome de um jogador para buscar ou criar um novo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <Input 
            placeholder="Digite o nome do jogador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />}
        </div>

        <div className="mt-4 space-y-2 min-h-[100px] max-h-60 overflow-y-auto">

        {/* Mostra a opção de criar jogador fantasma se houver texto na busca */}
          {!isSearching && searchQuery.trim().length > 1 && (
            <>
              {searchResults.length > 0}
              <div className="text-center text-sm text-zinc-500">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddGhostMember}
                  disabled={isAdding === "ghost"}
                >
                  {isAdding === "ghost" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Ghost className="h-4 w-4 mr-2" />
                  )}
                  Adicionar "{searchQuery}" como jogador fantasma
                </Button>
              </div>
              <Separator className="my-4 bg-zinc-700" />
            </>
          )}

          {/* Mostra os resultados da busca */}
          {searchResults.length > 0 && (
            searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-md bg-zinc-800 hover:bg-zinc-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photo_url} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <p>{user.name}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-green-500 hover:text-green-400"
                  onClick={() => handleAddMember(user)}
                  disabled={isAdding === user.id}
                >
                  {isAdding === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-5 w-5" />
                  )}
                </Button>
              </div>
            ))
          )}

          {/* Mensagem de "Nenhum resultado" quando aplicável */}
          {!isSearching && searchQuery.trim().length > 1 && searchResults.length === 0 && (
              <p className="text-center text-sm text-zinc-500 pt-8">Nenhum usuário encontrado.</p>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}