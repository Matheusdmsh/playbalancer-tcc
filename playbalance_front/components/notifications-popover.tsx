"use client"
import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getNotifications, getUnreadCount, markAllAsRead, type Notification } from "@/services/notifications"

export function NotificationsPopover() {
  const [items, setItems] = useState<Notification[]>([]); const [count, setCount] = useState(0)
  const load = async () => { try { setItems(await getNotifications()); setCount(await getUnreadCount()) } catch {} }
  useEffect(() => { load() }, [])
  const open = async (value: boolean) => { if (value && count) { await markAllAsRead(); setCount(0); setItems(items.map(i => ({ ...i, is_read: true }))) } }
  return <Popover onOpenChange={open}><PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative"><Bell className="h-5 w-5" />{count > 0 && <span className="absolute -top-1 -right-1 rounded-full bg-green-500 px-1 text-[10px] text-black">{count}</span>}</Button></PopoverTrigger><PopoverContent className="w-80 bg-zinc-900 border-zinc-800"><h3 className="font-semibold mb-2">Notificações</h3>{items.length ? items.slice(0,10).map(i => <Link className="block p-2 rounded hover:bg-zinc-800 text-sm" href={i.link || "#"} key={i._id}>{i.message}</Link>) : <p className="text-sm text-zinc-400">Nenhuma notificação nova.</p>}</PopoverContent></Popover>
}
