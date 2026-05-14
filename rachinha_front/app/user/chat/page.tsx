import { redirect } from "next/navigation";

export default async function ChatRedirectPage() {
  
  redirect(`/user/chat/message`);
}