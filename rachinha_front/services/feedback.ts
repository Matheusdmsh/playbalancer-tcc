import api from "./api";

export interface Feedback {
  title: string;
  description: string;
  type: "bug" | "suggestion" | "other";
}

export async function submitFeedback(feedback: Feedback): Promise<void> {
  try {
    await api.post("/feedback/", feedback);
  } catch (error: any) {
    const message =
      error.response?.data?.detail || "Erro ao enviar feedback";
    throw new Error(message);
  }
}