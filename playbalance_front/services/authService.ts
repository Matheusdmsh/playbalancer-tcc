import Cookies from 'js-cookie';
import axios from 'axios';
import { handleApiError } from '@/lib/utils';
import api from './api'; // Import a instância do axios para o login

// O nome do cookie é definido como uma constante para evitar erros de digitação.
const TOKEN_COOKIE_NAME = 'playbalance_token';

function shouldUseSecureCookie(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

/**
 * Salva o token de autenticação no cookie.
 * @param token O token de acesso recebido da API.
 */
export function setToken(token: string): void {
  // Define o cookie para ser acessível em todo o site (path: '/') e expira em 7 dias.
  Cookies.set(TOKEN_COOKIE_NAME, token, {
    path: '/',
    expires: 7,
    sameSite: 'Lax',
    secure: shouldUseSecureCookie(),
  });
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
    } catch (error) {
        if (axios.isAxiosError(error) && error.request && !error.response) {
            throw new Error("Não foi possível conectar ao servidor.");
        }
        throw handleApiError(error, "E-mail ou senha inválidos.");
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
  } catch (error) {
    const apiError = handleApiError(error, "Erro ao registrar usuário");
    console.log("Erro ao registrar usuário:", apiError.message);
    throw apiError;
  }
}

export async function resendEmailVerification() {
  try {
    const response = await api.post("/auth/resend-verification");
    return response.data;
  } catch (error) {
    throw handleApiError(error, "Erro ao tentar reenviar o e-mail de verificação.");
  }
}

