import type { CardVariant } from "@/components/card/card.types";

export interface User {
  _id: string;
  id: string;
  email: string;
  username: string;
  hashed_password: string;
  role: string[];
  name: string;
  nickname?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_email_verified: boolean;
  photo_url: string;
  skill_level?: number;
  phone_number?: string;
  is_placeholder?: boolean;
  sport_ratings?: Record<string, number>;
  active_card_template?: CardVariant;
}
