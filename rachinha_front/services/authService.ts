import Cookies from 'js-cookie';
import api from './api'; // Import a instância do axios para o login

// O nome do cookie é definido como uma constante para evitar erros de digitação.
const TOKEN_COOKIE_NAME = 'rachinha_token';

/**
 * Salva o token de autenticação no cookie.
 * @param token O token de acesso recebido da API.
 */
export function setToken(token: string): void {
  // Define o cookie para ser acessível em todo o site (path: '/') e expira em 7 dias.
  Cookies.set(TOKEN_COOKIE_NAME, token, { path: '/', expires: 7, sameSite: 'Lax' });
}

/**
 * Recupera o token de autenticação do cookie.
 * @returns O token de acesso ou undefined se não existir.
 */
export function getToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE_NAME);
}

/**
 * Remove o cookie de autenticação e redireciona o usuário para a página inicial.
 * Esta é a única função necessária para o logout.
 */
export function logout(): void {
  // Garante a remoção do cookie usando o mesmo nome e path definidos no setToken.
  Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
  
  // Redireciona o usuário após limpar a sessão.
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

/**
 * Realiza a chamada de login na API e armazena o token em caso de sucesso.
 * @param email O email do usuário.
 * @param password A senha do usuário.
 * @returns Os dados retornados pela API.
 */
export async function login(username: string, password: string): Promise<{ access_token: string }> {
    const payload = {
    username,
    password,
  };
    try {
        const response = await api.post('/auth/login', payload);

        // Se o login for bem-sucedido, armazena o token usando nossa função centralizada.
        if (response.data.access_token) {
            setToken(response.data.access_token);
        }

        return response.data;
    } catch (error: any) {
        let message = "Ocorreu um erro desconhecido.";
        if (error.response) {
            message = error.response.data.detail || "E-mail ou senha inválidos.";
        } else if (error.request) {
            message = "Não foi possível conectar ao servidor.";
        } else {
            message = error.message;
        }
        // Lança o erro para que a interface possa exibi-lo ao usuário.
        throw new Error(message);
    }
}

export async function loginWithGoogle() {
  try {
    const response = await api.get("/auth/google/login");
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Erro ao iniciar o login com Google";
    throw new Error(message);
  }
}

export async function checkGoogleStatus(idToken: string) {
  try {
    const response = await api.post("/auth/google/check", { id_token: idToken });
    return response.data; // { status: "linked" | "email_match" | "new_user", email: string }
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao verificar status Google";
    throw new Error(message);
  }
}

export async function authenticateGoogle(idToken: string) {
  try {
    const response = await api.post("/auth/google/authenticate", { id_token: idToken });
    if (response.data.access_token) {
      setToken(response.data.access_token);
    }
    return response.data; // Pode retornar access_token ou temp_token
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao autenticar com Google";
    throw new Error(message);
  }
}

// Cadastro
export async function register(name: string, username: string, email: string, password: string) {
  const payload = {
    email,
    password,
    role: ["user"],
    name,
    username
  };

  try {
    const response = await api.post("/auth/register", payload);
    console.log("Cadastro bem-sucedido:", response.data);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Erro ao registrar usuário";
      console.log("Erro ao registrar usuário:", message);
    throw new Error(message);
  }
}

export async function resendEmailVerification() {
  try {
    const response = await api.post("/auth/resend-verification");
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Erro ao tentar reenviar o e-mail de verificação.";
    throw new Error(message);
  }
}

export async function googleRegister(temp_token: string, username: string, nickname?: string, password?: string) {
  try {
    const response = await api.post("/auth/google/register", { temp_token, username, nickname, password });
    if (response.data.access_token) {
      setToken(response.data.access_token);
    }
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao criar conta com Google";
    throw new Error(message);
  }
}

export async function googleLink(temp_token: string, username: string, password: string) {
  try {
    const response = await api.post("/auth/google/link", { temp_token, username, password });
    if (response.data.access_token) {
      setToken(response.data.access_token);
    }
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao vincular conta com Google";
    throw new Error(message);
  }
}
export async function authenticateApple(idToken: string, name?: string, username?: string) {
  try {
    const response = await api.post("/auth/apple/login", { id_token: idToken, name, username });
    if (response.data.access_token) {
      setToken(response.data.access_token);
    }
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao autenticar com Apple";
    throw new Error(message);
  }
}

export async function appleLink(idToken: string) {
  try {
    const response = await api.post("/auth/apple/link", { id_token: idToken });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || "Erro ao vincular conta com Apple";
    throw new Error(message);
  }
}
export async function getConnections() {
  try {
    const response = await api.get("/auth/connections");
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Erro ao buscar conexões");
  }
}

export async function disconnectProvider(provider: string) {
  try {
    const response = await api.delete(`/auth/connections/${provider}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || "Erro ao remover conexão");
  }
}