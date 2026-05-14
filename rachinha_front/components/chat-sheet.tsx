"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Send, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"

import {
  getGroupChatHistory,
  GroupMessage,
  GroupChatSocket,
} from "@/services/chat"
import { getCurrentUser, getUsersByIds } from "@/services/users"
import { Group } from "@/services/groups"
import type { User } from "@/interface/users"
import { parseUTCDate } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface ChatSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
}

export function ChatSheet({ open, onOpenChange, group }: ChatSheetProps) {
  const isMobile = useIsMobile()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [groupMembers, setGroupMembers] = useState<Map<string, User>>(
    new Map()
  )

  const { toast } = useToast()
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const socketRef = useRef<GroupChatSocket | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Carregar usuário atual
  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() =>
        toast({
          title: "Erro",
          description: "Não foi possível identificar o usuário.",
          variant: "destructive",
        })
      )
  }, [toast])

  // Gerenciar chat quando o sheet é aberto
  useEffect(() => {
    if (!open) {
      socketRef.current?.disconnect()
      return
    }

    setIsLoading(true)

    // Buscar histórico de mensagens
    getGroupChatHistory(group._id)
      .then(setMessages)
      .catch((error) =>
        toast({
          title: "Erro ao buscar histórico",
          description: error.message,
          variant: "destructive",
        })
      )

    // Buscar dados dos membros
    if (group.members && group.members.length > 0) {
      const memberIds = group.members.map((m) => m.id)
      getUsersByIds(memberIds)
        .then((users) => {
          const membersMap = new Map<string, User>()
          users.forEach((user) => membersMap.set(user._id, user))
          setGroupMembers(membersMap)
        })
        .catch((error) =>
          toast({
            title: "Erro ao buscar membros",
            description: error.message,
            variant: "destructive",
          })
        )
    }

    // Conectar ao WebSocket
    const handleNewMessage = (message: GroupMessage) => {
      setMessages((prevMessages) => {
        if (prevMessages.find((m) => m._id === message._id)) {
          return prevMessages
        }
        return [...prevMessages, message]
      })
    }

    socketRef.current = new GroupChatSocket()
    socketRef.current.connect(
      group._id,
      handleNewMessage,
      (error) =>
        toast({
          title: "Erro no Chat",
          description: error,
          variant: "destructive",
        })
    )

    setIsLoading(false)

    return () => {
      socketRef.current?.disconnect()
    }
  }, [open, group._id, group.members, toast])

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    autoResizeTextarea()
  }

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.sendMessage(newMessage)
      setNewMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile
          ? "bg-zinc-900 border-zinc-800 w-full max-w-none min-h-[80vh] max-h-[88vh] rounded-t-2xl p-0 flex flex-col overflow-hidden pb-2"
          : "bg-zinc-900 border-zinc-800 w-[360px] sm:max-w-md p-0 flex flex-col overflow-hidden pb-2 sm:pb-0"
        }
      >
        {/* Header */}
        <div className="border-b border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            {group.photo_url ? (
              <Image
                src={group.photo_url}
                alt={group.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover bg-zinc-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                <Users className="h-5 w-5 text-zinc-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="text-base font-semibold text-foreground text-left">{group.name}</div>
              <p className="text-xs text-zinc-400 mt-1">
                {group.members?.length || 0} {group.members?.length === 1 ? "membro" : "membros"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-sm text-zinc-400 py-8">
              Carregando mensagens...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-zinc-400 py-8">
              Nenhuma mensagem ainda. Inicie a conversa!
            </div>
          ) : (
            messages.map((message) => {
              const sender = groupMembers.get(message.sender_id)
              const isCurrentUser = message.sender_id === currentUser?._id
              const parsedTimestamp = parseUTCDate(message.timestamp)

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
                )
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
                          className="w-8 h-8 rounded-full object-cover bg-zinc-700"
                        />
                      ) : (
                        <p className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium bg-muted">
                          {sender?.name?.charAt(0).toUpperCase() || (
                            <Users className="h-4 w-4 text-zinc-200" />
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
                )
              }
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-800 p-4 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-flex-end">
            <textarea
              ref={textareaRef}
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e as any)
                }
              }}
              disabled={!currentUser}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white resize-none max-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-green-500"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              className="bg-green-500 hover:bg-green-600 flex-shrink-0"
              disabled={!currentUser}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
