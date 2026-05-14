import { Calendar, MessageCircle, Users, Bell } from "lucide-react";
import { Notification } from "@/services/notifications";

interface NotificationIconProps {
  type: Notification['notification_type'];
  className?: string;
}

export function NotificationIcon({ type, className = "h-5 w-5" }: NotificationIconProps) {
  switch (type) {
    case "booking_invitation":
    case "booking_removal":
      return <Calendar className={className} />;
    case "group_invitation":
      return <Users className={className} />;
    case "new_group_message":
    case "new_booking_message":
      return <MessageCircle className={className} />;
    default:
      return <Bell className={className} />;
  }
}