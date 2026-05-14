export interface Invite {
  _id: string;
  booking_id: string;
  user_id: string;
  status: "pending" | "accepted" | "declined";
  sent_at: string; // ou Date
  updated_at: string; // ou Date
}
