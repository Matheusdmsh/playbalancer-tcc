import api from "./api"

export interface Notification { _id: string; message: string; link?: string; is_read: boolean; created_at: string }
export const getNotifications = async () => (await api.get<Notification[]>("/notifications/my")).data
export const getUnreadCount = async () => (await api.get<{ unread_count: number }>("/notifications/unread/count")).data.unread_count
export const markAllAsRead = async () => api.post("/notifications/read/all")
