import api from "./api";


export interface Transaction {
  _id: string;
  group_id: string;
  amount: number;
  description: string;
  type: 'revenue' | 'expense';
  created_at: string; 
  user_id: string;

}

export interface CreateTransactionPayload {
  group_id: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  user_id: string;
}

export interface Balance {
  balance: number;
  total_revenue?: number;
  total_expense?: number;
}

/**
 * Busca todas as transações de um grupo específico.
 * @param groupId - O ID do grupo.
 * @returns Uma lista de transações.
 */
export async function getTransactionsForGroup(groupId: string): Promise<Transaction[]> {
  try {
    const response = await api.get<Transaction[]>(`/transactions/groups/${groupId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao buscar as transações da turma";
    throw new Error(message);
  }
}

/**
 * Busca o balanço financeiro (caixa) de um grupo.
 * @param groupId - O ID do grupo.
 * @returns O balanço do grupo.
 */
export async function getGroupBalance(groupId: string): Promise<Balance> {
  try {
    const response = await api.get<Balance>(`/transactions/groups/${groupId}/balance`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao buscar o caixa da turma";
    throw new Error(message);
  }
}

export const createTransaction = async (payload: CreateTransactionPayload): Promise<Transaction> => {
  const response = await api.post('/transactions/', payload);
  return response.data;
};