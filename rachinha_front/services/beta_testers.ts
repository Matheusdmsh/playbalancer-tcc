import api from "./api";

export async function postBetaTester(email: string): Promise<string> {
  try {
    const response = await api.post<{ id: string }>("/collect_email", { email });
    return response.data.id; 
  } catch (error) {
    throw handleApiError(error, "Erro ao buscar os dados do usuário");
  }
}

function handleApiError(error: unknown, message: string) {
  console.error(message, error);
  throw new Error(message);
}
