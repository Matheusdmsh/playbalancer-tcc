"use client";

import type React from "react";
import { ChatSheet } from "@/components/chat-sheet";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { listMyGroups, Group } from "@/services/groups";
import {
  getGroupChatHistory,
  getLastMessagesForGroups,
  GroupMessage,
  GroupChatSocket,
} from "@/services/chat";
import { getCurrentUser, getUsersByIds } from "@/services/users";
import { User } from "@/interface/users";
import Image from "next/image";
import { useParams } from "next/navigation";
import { parseUTCDate } from "@/lib/utils";

interface Conversation extends Group {
  lastMessageSenderId: any;
  lastMessage: string;
  time: string;
  unread: boolean;
}

export default function UserMessages() {
    const [isChatSheetOpen, setIsChatSheetOpen] = useState(false);
    const [chatSheetGroup, setChatSheetGroup] = useState<Conversation | null>(null);
  const params = useParams();
  const chatIdFromUrl = params.id as string;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<Map<string, User>>(
    new Map()
  );

  const { toast } = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const socketRef = useRef<GroupChatSocket | null>(null);

  // Efeito para buscar o usuário logado
  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() =>
        toast({
          title: "Erro",
          description: "Não foi possível identificar o usuário.",
          variant: "destructive",
        })
      );
  }, [toast]);

  // Efeito para buscar as conversas (grupos)
  useEffect(() => {
    async function loadConversations() {
      setIsLoading(true);
      try {
        const myGroups = await listMyGroups();
        if (myGroups.length > 0) {
          const groupIds = myGroups.map((g) => g._id);
          const lastMessages = await getLastMessagesForGroups(groupIds);

          const convs = myGroups.map((group) => {
            const lastMessageTimestamp = lastMessages[group._id]?.timestamp;
            const parsedDate = parseUTCDate(lastMessageTimestamp);

            return {
              ...group,
              lastMessage: lastMessages[group._id]?.content || "Inicie a conversa!",
              lastMessageSenderId: lastMessages[group._id]?.sender_id || null,
              time: parsedDate
                ? parsedDate.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  })
                : "",
              unread: false,
            };
          });

          setConversations(convs);
          let initialConversation: Conversation | null = null;
          if (chatIdFromUrl) {
            initialConversation =
              convs.find((c) => c._id === chatIdFromUrl) || null;
          }
          if (!initialConversation && convs.length > 0) {
            initialConversation = convs[0];
          }

          setSelectedConversation(initialConversation);
        }
      } catch (error: any) {
        toast({
          title: "Erro ao carregar turmas",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadConversations();
  }, [toast, chatIdFromUrl]);

  const handleSelectConversation = (conversation: Conversation) => {
    setMessages([]);
    setSelectedConversation(conversation);
  };

  const handleNewMessage = useCallback((message: GroupMessage) => {
    setMessages((prevMessages) => {
      if (prevMessages.find((m) => m._id === message._id)) {
        return prevMessages;
      }
      return [...prevMessages, message];
    });
  }, []);

  useEffect(() => {
    socketRef.current?.disconnect();

    if (selectedConversation?._id) {
      getGroupChatHistory(selectedConversation._id)
        .then(setMessages)
        .catch((error) =>
          toast({
            title: "Erro ao buscar histórico",
            description: error.message,
            variant: "destructive",
          })
        );

      if (
        selectedConversation.members &&
        selectedConversation.members.length > 0
      ) {
        const memberIds = selectedConversation.members.map((m) => m.id);
        getUsersByIds(memberIds)
          .then((users) => {
            const membersMap = new Map<string, User>();
            users.forEach((user) => membersMap.set(user._id, user));
            setGroupMembers(membersMap);
          })
          .catch((error) =>
            toast({
              title: "Erro ao buscar membros",
              description: error.message,
              variant: "destructive",
            })
          );
      }

      socketRef.current = new GroupChatSocket();
      socketRef.current.connect(
        selectedConversation._id,
        handleNewMessage,
        (error) =>
          toast({
            title: "Erro no Chat",
            description: error,
            variant: "destructive",
          })
      );
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [selectedConversation, handleNewMessage, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.sendMessage(newMessage);
      setNewMessage("");
    }
  };

  if (isLoading && conversations.length === 0) {
    return (
      <div className="animate-pulse h-[calc(100vh-57px)] overflow-hidden md:max-w-7xl mx-auto">
        {/* Mobile skeleton */}
        <div className="md:hidden h-full px-4 pt-4 pb-20 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40">
              <div className="w-10 h-10 rounded-full bg-zinc-800/70" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-zinc-800/70 rounded" />
                <div className="h-3 w-28 bg-zinc-800/60 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop skeleton */}
        <div className="hidden md:flex h-full">
          <div className="w-80 p-4 space-y-3">
            <div className="h-6 w-28 bg-zinc-800/70 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40">
                <div className="w-10 h-10 rounded-full bg-zinc-800/70" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-zinc-800/70 rounded" />
                  <div className="h-3 w-24 bg-zinc-800/60 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4">
            <div className="h-14 w-full rounded-lg bg-zinc-900/40" />
            <div className="flex-1 rounded-lg bg-zinc-900/30" />
            <div className="h-14 w-full rounded-lg bg-zinc-900/40" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* MOBILE: Lista de turmas e ChatSheet */}
      <div className="md:hidden h-[calc(100vh-57px)] overflow-hidden">
        <div className="h-full overflow-y-auto pt-4 px-4 pb-20">
          
          {conversations.length > 0 ? (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  className="flex items-center gap-3 w-full p-3 rounded-lg text-left hover:bg-zinc-800"
                  onClick={() => {
                    setChatSheetGroup(conversation);
                    setIsChatSheetOpen(true);
                  }}
                >
                  <div className="relative flex-shrink-0">
                    {conversation.photo_url ? (
                      <Image
                        src={conversation.photo_url}
                        alt={conversation.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover bg-zinc-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                        <Users className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    {conversation.unread && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="font-medium truncate">
                        {conversation.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {(() => {
                          if (!conversation.time) return "";
                          const [hour, minute] = conversation.time
                            .split(":")
                            .map(Number);
                          const now = new Date();
                          const msgDate = new Date(now);
                          msgDate.setHours(hour, minute, 0, 0);

                          if (
                            msgDate.getDate() === now.getDate() &&
                            msgDate.getMonth() === now.getMonth() &&
                            msgDate.getFullYear() === now.getFullYear()
                          ) {
                            const diffMs = now.getTime() - msgDate.getTime();
                            if (diffMs < 5 * 60 * 1000) return "agora";
                            return conversation.time;
                          }

                          const yesterday = new Date(now);
                          yesterday.setDate(now.getDate() - 1);
                          if (
                            msgDate.getDate() === yesterday.getDate() &&
                            msgDate.getMonth() === yesterday.getMonth() &&
                            msgDate.getFullYear() === yesterday.getFullYear()
                          ) {
                            return "Ontem";
                          }
                          
                          return conversation.time;
                        })()}
                      </p>
                    </div>
                    <p className="text-sm text-zinc-400 truncate">
                      {(() => {
                        const conv = conversations.find(
                          (c) => c._id === conversation._id
                        );
                        if (!conv) return "Inicie a conversa!";
                        if (!conv.lastMessage) return "Inicie a conversa!";
                        if (conv.lastMessageSenderId === currentUser?._id) {
                          return `Você: ${conv.lastMessage}`;
                        }
                        const senderName = groupMembers.get(
                          conv.lastMessageSenderId
                        )?.name;
                        return `${senderName ? senderName + ": " : ""}${
                          conv.lastMessage
                        }`;
                      })()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center text-sm text-zinc-500 h-full">
              Você não faz parte de nenhuma turma ainda.
            </div>
          )}
        </div>
        {/* ChatSheet para mobile */}
        {chatSheetGroup && (
          <ChatSheet
            open={isChatSheetOpen}
            onOpenChange={setIsChatSheetOpen}
            group={chatSheetGroup}
          />
        )}
      </div>
      {/* DESKTOP: Layout antigo */}
      <div className="hidden md:flex h-[calc(100vh-57px)] overflow-hidden md:max-w-7xl mx-auto">
        {/* ...existing code... */}
        <div className="w-80  overflow-y-auto bg-zinc-900 rounded-lg m-2 mb-4">
          <div className="pt-4 px-4 pb-4">
            <h2 className=" text-lg font-bold mb-2">Meus Chats</h2>
            {conversations.length > 0 ? (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg text-left ${
                      selectedConversation?._id === conversation._id
                        ? "bg-zinc-800"
                        : "hover:bg-zinc-800"
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="relative flex-shrink-0">
                      {conversation.photo_url ? (
                        <Image
                          src={conversation.photo_url}
                          alt={conversation.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover bg-zinc-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                          <Users className="h-5 w-5 text-zinc-400" />
                        </div>
                      )}
                      {conversation.unread && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="font-medium truncate">
                          {conversation.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {(() => {
                            if (!conversation.time) return "";
                            const [hour, minute] = conversation.time
                              .split(":")
                              .map(Number);
                            const now = new Date();
                            const msgDate = new Date(now);
                            msgDate.setHours(hour, minute, 0, 0);

                            if (
                              msgDate.getDate() === now.getDate() &&
                              msgDate.getMonth() === now.getMonth() &&
                              msgDate.getFullYear() === now.getFullYear()
                            ) {
                              const diffMs = now.getTime() - msgDate.getTime();
                              if (diffMs < 5 * 60 * 1000) return "agora";
                              return conversation.time;
                            }

                            const yesterday = new Date(now);
                            yesterday.setDate(now.getDate() - 1);
                            if (
                              msgDate.getDate() === yesterday.getDate() &&
                              msgDate.getMonth() === yesterday.getMonth() &&
                              msgDate.getFullYear() === yesterday.getFullYear()
                            ) {
                              return "Ontem";
                            }
                            
                            return conversation.time;
                          })()}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-400 truncate">
                        {(() => {
                          const conv = conversations.find(
                            (c) => c._id === conversation._id
                          );
                          if (!conv) return "Inicie a conversa!";
                          if (!conv.lastMessage) return "Inicie a conversa!";
                          if (conv.lastMessageSenderId === currentUser?._id) {
                            return `Você: ${conv.lastMessage}`;
                          }
                          const senderName = groupMembers.get(
                            conv.lastMessageSenderId
                          )?.name;
                          return `${senderName ? senderName + ": " : ""}${
                            conv.lastMessage
                          }`;
                        })()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center text-sm text-zinc-500 h-full">
                Você não faz parte de nenhuma turma ainda.
              </div>
            )}
          </div>
        </div>
        {/* Área de chat desktop */}
        <div className="flex-1 flex flex-col ">
          {selectedConversation ? (
            <>
              {/* Cabeçalho do chat */}
              <div className="flex items-center gap-3 px-4 py-2  mt-2 rounded-lg">
                {selectedConversation.photo_url ? (
                  <Image
                    src={selectedConversation.photo_url}
                    alt={selectedConversation.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover bg-zinc-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                    <Users className="h-5 w-5 text-zinc-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{selectedConversation.name}</p>
                  <p className="text-xs text-zinc-400">
                    {selectedConversation.members?.length}{" "}
                    {selectedConversation.members?.length === 1
                      ? "membro"
                      : "membros"}
                  </p>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                {messages.map((message) => {
                  const sender = groupMembers.get(message.sender_id);
                  const isCurrentUser = message.sender_id === currentUser?._id;
                  const parsedTimestamp = parseUTCDate(message.timestamp);

                  if (isCurrentUser) {
                    return (
                      <div key={message._id} className="flex justify-end">
                        <div className="max-w-[70%] rounded-lg p-3 bg-green-500 text-white">
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 text-right mt-1">
                            {parsedTimestamp
                              ? parsedTimestamp.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "America/Sao_Paulo",
                                })
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={message._id} className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {sender?.photo_url ? (
                            <Image
                              src={sender.photo_url}
                              alt={sender.name || ""}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover bg-zinc-700"
                            />
                          ) : (
                            <p className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center bg-muted">
                              {sender?.name?.charAt(0).toUpperCase() || (
                                <Users className=" text-zinc-200" />
                              )}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start">
                          <p className="text-xs font-medium text-zinc-400 mb-1">
                            {sender?.name || "Usuário"}
                          </p>
                          <div className="max-w-full rounded-lg p-3 bg-zinc-800 text-white">
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 text-right mt-1">
                              {parsedTimestamp
                                ? parsedTimestamp.toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone: "America/Sao_Paulo",
                                  })
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensagem */}
              <form
                onSubmit={handleSendMessage}
                className="px-4 pt-4"
              >
                <div className="flex gap-2 pb-4">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-zinc-900 border-zinc-700"
                    disabled={!currentUser}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-green-500 hover:bg-green-600"
                    disabled={!currentUser}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-zinc-500">
              <p>
                {conversations.length > 0
                  ? "Selecione uma turma para começar a conversar."
                  : "Crie ou entre em uma turma para usar o chat."}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}