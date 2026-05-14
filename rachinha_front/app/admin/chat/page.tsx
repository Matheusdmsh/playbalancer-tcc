"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MessageCircle, Send, Building } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import api from "@/services/api"
import { getToken } from "@/services/authService"

interface Booking {
  _id: string;
  court_id: string;
  court_name?: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: string;
  modality?: string;
}

interface Message {
  _id: string;
  booking_id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  pending:   { label: "Pendente", dot: "bg-yellow-400" },
  confirmed: { label: "Confirmada", dot: "bg-green-400" },
  completed: { label: "Concluída", dot: "bg-blue-400" },
  cancelled: { label: "Cancelada", dot: "bg-red-400" },
  rejected:  { label: "Rejeitada", dot: "bg-red-500" },
}

export default function AdminChat() {
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get current user ID from token
  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.sub || "")
      } catch { /* ignore */ }
    }
  }, [])

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/bookings/admin/court-bookings')
      // Only show confirmed or completed bookings in chat
      const chatBookings = (response.data || []).filter(
        (b: Booking) => ['confirmed', 'completed'].includes(b.status)
      )
      setBookings(chatBookings)
    } catch (error) {
      toast({ title: "Erro ao carregar conversas", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const loadMessages = useCallback(async (bookingId: string) => {
    setLoadingMessages(true)
    try {
      const response = await api.get(`/booking-messages/${bookingId}/history`)
      setMessages(response.data || [])
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const connectWebSocket = useCallback((bookingId: string) => {
    // Close previous connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    const token = getToken()
    if (!token) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL || '').replace('http', 'ws')
    const ws = new WebSocket(`${wsUrl}/booking-messages/ws/${bookingId}?token=${token}`)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'message') {
          setMessages(prev => [...prev, msg.data])
        }
      } catch { /* ignore */ }
    }

    ws.onerror = () => {
      // WebSocket unavailable - fallback to polling
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectBooking = async (booking: Booking) => {
    setSelectedBooking(booking)
    setMessages([])
    await loadMessages(booking._id)
    if (booking.status === 'confirmed') {
      connectWebSocket(booking._id)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedBooking) return

    const msg = newMessage.trim()
    setNewMessage("")
    setSendingMessage(true)

    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ content: msg }))
      } else {
        // Fallback to REST
        const response = await api.post(`/booking-messages/${selectedBooking._id}`, { content: msg })
        setMessages(prev => [...prev, response.data])
      }
    } catch (error) {
      toast({ title: "Erro ao enviar mensagem", description: (error as Error).message, variant: "destructive" })
    } finally {
      setSendingMessage(false)
    }
  }

  const isConcluded = (booking: Booking) => booking.status === 'completed' || booking.status === 'cancelled'

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
      {/* Lista de chats */}
      <div className="w-80 border-r border-zinc-800 overflow-y-auto hidden md:block">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Chats de Reservas</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500">Nenhuma conversa ainda.</p>
              <p className="text-xs text-zinc-600 mt-1">Approve reservas para iniciar chats.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {bookings.map((booking) => {
                const cfg = STATUS_CONFIG[booking.status]
                const isActive = selectedBooking?._id === booking._id
                const concluded = isConcluded(booking)

                return (
                  <button
                    key={booking._id}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl text-left transition-colors ${
                      isActive ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                    } ${concluded ? 'opacity-50' : ''}`}
                    onClick={() => handleSelectBooking(booking)}
                  >
                    <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                      <Building className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="font-medium text-sm truncate">{booking.court_name || 'Quadra'}</p>
                        <span className={`h-2 w-2 rounded-full shrink-0 ${cfg?.dot || 'bg-zinc-600'}`} />
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        {formatDate(booking.start_time)} — {booking.modality || booking.status}
                      </p>
                      {concluded && <p className="text-xs text-zinc-600 italic">Chat encerrado</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedBooking ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500">
            <MessageCircle className="h-14 w-14 text-zinc-700" />
            <p className="text-lg font-medium">Selecione uma conversa</p>
            <p className="text-sm text-zinc-600">Escolha uma reserva na lista ao lado</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800 shrink-0">
              <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center">
                <Building className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{selectedBooking.court_name || 'Quadra'}</p>
                <p className="text-xs text-zinc-400">
                  {formatDate(selectedBooking.start_time)} • {selectedBooking.modality || ''} •{' '}
                  <span className={`${STATUS_CONFIG[selectedBooking.status]?.dot.replace('bg-', 'text-') || 'text-zinc-400'}`}>
                    {STATUS_CONFIG[selectedBooking.status]?.label || selectedBooking.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  Nenhuma mensagem ainda. Inicie a conversa!
                </div>
              ) : (
                messages.map((message) => {
                  const isMe = message.sender_id === currentUserId
                  return (
                    <div key={message._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-green-500 text-white rounded-br-sm' : 'bg-zinc-800 text-white rounded-bl-sm'}`}>
                        {!isMe && message.sender_name && (
                          <p className="text-xs opacity-70 mb-1">{message.sender_name}</p>
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className="text-xs opacity-60 text-right mt-1">{formatTime(message.created_at)}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {isConcluded(selectedBooking) ? (
              <div className="p-4 border-t border-zinc-800 text-center text-sm text-zinc-500">
                Este chat foi encerrado pois a reserva foi concluída.
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 focus:border-green-500"
                    disabled={sendingMessage}
                  />
                  <Button type="submit" size="icon" className="bg-green-500 hover:bg-green-600 shrink-0" disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
