export interface Member {
  _id: string;
  id: {
    _id: string;
    name: string;
    photo_url?: string;
  };
  skill_level: number;
}

export interface Group {
  _id: string;
  name: string;
  photo_url?: string;
  owner_id: string;
  members: Member[];
}

export interface Booking {
  _id: string;
  start_time: string;
  end_time: string;
  location: {
    alt: string;
  };
  owner: {
    _id: string;
    name: string;
  };
}

export interface Balance {
  total_revenue: number;
  total_expense: number;
  balance: number;
}

export interface Transaction {
  _id: string;
  description: string;
  user: {
    name: string;
  };
  date: string;
  amount: number;
  type: "revenue" | "expense";
}


const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Busca todos os dados necessários para o dashboard de uma só vez.
 * @param groupId - O ID da turma.
 * @returns Um objeto contendo todos os dados da turma.
 */
export const getGroupDashboardData = async (groupId: string) => {
  try {
    const [groupRes, bookingsRes, balanceRes, transactionsRes] = await Promise.all([
      fetch(`${API_URL}/groups/${groupId}`),
      fetch(`${API_URL}/groups/${groupId}/bookings`),
      fetch(`${API_URL}/groups/${groupId}/balance`),
      fetch(`${API_URL}/groups/${groupId}/transactions`),
    ]);

    if (!groupRes.ok || !bookingsRes.ok || !balanceRes.ok || !transactionsRes.ok) {
      throw new Error('Falha ao buscar os dados da turma');
    }

    const group: Group = await groupRes.json();
    const bookings: Booking[] = await bookingsRes.json();
    const balance: Balance = await balanceRes.json();
    const transactions: Transaction[] = await transactionsRes.json();

    return { group, bookings, balance, transactions };

  } catch (error) {
    console.error("Erro no serviço da API:", error);
    throw error;
  }
};