"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Users,
  Loader2,
  AlertTriangle,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

// Importe a nova função do serviço
import { getGroupByInviteToken, joinGroupWithLink, Group } from "@/services/groups";
import { User } from "@/interface/users";
import { getUsersByIds } from "@/services/users";

export default function JoinGroupPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const token = params.token as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (!token) {
        setError("Token de convite inválido.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const groupData = await getGroupByInviteToken(token);
        setGroup(groupData);

        if (groupData.members && groupData.members.length > 0) {
           setMembers(groupData.members as any); 
        }
      } catch (err: any) {
        setError("Convite inválido ou expirado.");
        toast({
          title: "Erro",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGroupInfo();
  }, [token, toast]);

  const handleJoinGroup = async () => {
    setIsJoining(true);
    try {
      const joinedGroup = await joinGroupWithLink(token);
      toast({
        title: "Bem-vindo(a)!",
        description: `Você entrou na turma ${joinedGroup.name}.`,
      });
      router.push(`/user/group/${joinedGroup._id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao entrar na turma",
        description: error.message,
        variant: "destructive",
      });
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4">Carregando convite...</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 mb-4 border-2 border-zinc-700">
              <AvatarImage src={group?.photo_url || ""} />
              <AvatarFallback className="text-2xl bg-zinc-800">
                <Users />
              </AvatarFallback>
            </Avatar>
            {group ? (
              <>
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <p className="text-zinc-400">
                  {group.members?.length || 0} {group.members?.length === 1 ? "membro" : "membros"}
                </p>
              </>
            ) : (
              !error && <h1 className="text-2xl font-bold">Convite para Turma</h1>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <div className="text-red-500 flex flex-col items-center text-center">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="text-center text-zinc-300">
              <p>Você foi convidado para entrar na turma <strong>{group?.name}</strong>.</p>
              <p className="text-sm text-zinc-400 mt-2">
                Ao clicar no botão abaixo, você será adicionado como um novo
                membro.
              </p>
            </div>
          )}

          <Button
            className="w-full bg-green-500 hover:bg-green-600"
            onClick={handleJoinGroup}
            disabled={isJoining || !!error || !group}
          >
            {isJoining ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Entrar na Turma
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}