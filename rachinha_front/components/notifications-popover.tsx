"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { Notification, NotificationSocket, getMyNotifications, getUnreadCount, markAllAsRead } from "@/services/notifications";
import { NotificationIcon } from "./notification-icon";

const formatRelativeTime = (dateString: string) => {
    try {
        return formatDistanceToNowStrict(new Date(dateString), {
            addSuffix: true,
            locale: ptBR,
        });
    } catch (error) {
        return dateString;
    }
};

export function NotificationsPopover() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleNewNotification = useCallback((newNotification: Notification) => {
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    toast({
        title: "Nova Notificação",
        description: newNotification.message,
    });
  }, [toast]);

  const handleUnreadUpdate = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [initialNotifications, initialUnreadCount] = await Promise.all([
          getMyNotifications(),
          getUnreadCount()
        ]);
        setNotifications(initialNotifications);
        setUnreadCount(initialUnreadCount);
      } catch (error: any) {
        console.error("Failed to fetch initial notification data:", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const socket = new NotificationSocket();
    socket.connect(
      handleNewNotification,
      handleUnreadUpdate,
      (error) => console.error("Notification WS Error:", error)
    );
    return () => socket.disconnect();
  }, [handleNewNotification, handleUnreadUpdate]);
  
  const handleOpenChange = async (open: boolean) => {
      setIsOpen(open);
      if (open && unreadCount > 0) {
          try {
              await markAllAsRead();
              setUnreadCount(0);
              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          } catch (error: any) {
              toast({ title: "Erro", description: "Não foi possível marcar as notificações como lidas.", variant: "destructive"});
          }
      }
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-600">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-zinc-900 border-zinc-800 p-0" align="end">
        <div className="flex justify-between items-center p-4">
            <h3 className="font-semibold">Notificações</h3>
            <Button variant="link" size="sm" className="text-zinc-400 p-0 h-auto" onClick={() => handleOpenChange(true)}>
                <CheckCheck className="h-4 w-4 mr-1"/>
                Marcar como lidas
            </Button>
        </div>
        <Separator className="bg-zinc-800"/>
        <ScrollArea className="h-96">
            <div className="p-2">
                {isLoading ? (
                    <p className="text-center text-zinc-400 py-4">Carregando...</p>
                ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <Link href={notif.link || "#"} key={notif._id} onClick={() => setIsOpen(false)}>
                            <div className={cn(
                                "flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800",
                                !notif.is_read && "bg-green-500/10"
                            )}>
                                {!notif.is_read && <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />}
                                <div className={cn("text-zinc-400 shrink-0", !notif.is_read && "ml-0", notif.is_read && "ml-4")}>
                                  <NotificationIcon type={notif.notification_type} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-white">{notif.message}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{formatRelativeTime(notif.created_at)}</p>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p className="text-center text-zinc-400 py-4">Nenhuma notificação por aqui.</p>
                )}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}