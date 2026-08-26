import api from "./api";
import { handleApiError } from "@/lib/utils";

export interface Feedback {
  title: string;
  description: string;
  type: "bug" | "suggestion" | "other";
}

export async function submitFeedback(feedback: Feedback): Promise<void> {
  try {
    await api.post("/feedback/", feedback);
  } catch (error) {
    throw handleApiError(error, "Erro ao enviar feedback");
  }
}
