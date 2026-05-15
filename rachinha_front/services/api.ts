import axios from "axios";
import Cookies from 'js-cookie';

// O nome do cookie é o mesmo usado no authService para consistência.
const TOKEN_COOKIE_NAME = 'rachinha_token'; 

// A URL base agora aponta diretamente para o endpoint da API.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/rachinha',
  headers: {
    "Content-Type": "application/json",
  },
});

// Lista de rotas da API que são públicas e não devem causar redirecionamento.
// Usamos startsWith para cobrir rotas com parâmetros (ex: /users/verify-email/some-token).
const publicApiRoutes = [
    '/auth/login',           // Rota de login
    '/users/register',         // Rota de registro de novos usuários
    '/users/verify-email',   // Rota de verificação de email
    '/users/forgot-password',// Rota para solicitar recuperação de senha
    '/users/reset-password', // Rota para definir nova senha
    '/courts/public',        // Quadras públicas
    '/users/me/favorites',   // Falha silenciosamente em páginas públicas se não logado
];

// Interceptador de REQUISIÇÃO: Adiciona o token em todas as chamadas.
api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_COOKIE_NAME);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptador de RESPOSTA: Lida com renovação de token e erros de autenticação.
api.interceptors.response.use(
  (response) => {
    // Lógica de renovação de token (sliding session)
    const newToken = response.headers['authorization'];
    if (newToken) {
      const tokenValue = newToken.split(' ')[1];
      if (tokenValue) {
        console.log("Token de sessão renovado pelo servidor.");
        Cookies.set(TOKEN_COOKIE_NAME, tokenValue, { path: '/', sameSite: 'Lax' });
      }
    }
    return response;
  },
  (error) => {
    // Verifica se o erro é de autenticação (401) e se há uma resposta do servidor.
    if (error.response?.status === 401) {
        const originalRequestUrl = error.config.url;

        // Verifica se a rota que falhou é pública.
        const isPublicRoute = publicApiRoutes.some(route => originalRequestUrl?.startsWith(route));

        // Só redireciona se a rota NÃO for pública.
        // Isso evita que o usuário seja expulso da tela de login ao digitar a senha errada.
        if (!isPublicRoute && typeof window !== 'undefined') {
            console.error("Sessão inválida ou expirada. Redirecionando para o login.");
            // Remove o token inválido.
            Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
            // Força o redirecionamento.
            window.location.href = '/login';
        }
    }
    
    // Rejeita a promessa para que o erro possa ser tratado pela chamada original (ex: exibir toast).
    return Promise.reject(error);
  }
);

export default api;