import { AuthContextType } from "../types";

// --- CONFIGURAÇÃO DE CONEXÃO ---
// Se você estiver rodando local, usa localhost. Se estiver no Render, usa a URL de produção.
const PROD_API_URL = 'https://edari-api.onrender.com/api'; 

export const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : PROD_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('edari_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };

  try {
    const response = await fetch(url, { ...options, headers });

    // Tratamento de Erro 401 (Não Autorizado)
    if (response.status === 401) {
      // CASO 1: Tentativa de Login (Não deve deslogar, apenas avisar erro de senha)
      if (endpoint.includes('/auth/login') || endpoint.includes('/auth/social')) {
         const errorBody = await response.json().catch(() => ({}));
         throw new Error(errorBody.message || 'Credenciais inválidas.');
      }

      // CASO 2: Token expirado em rotas protegidas (Desloga o usuário)
      localStorage.removeItem('edari_token');
      localStorage.removeItem('edari_user_id');
      
      const currentPath = window.location.pathname;
      // Evita loop de reload na home ou login
      if (currentPath !== '/' && !currentPath.includes('login') && !currentPath.includes('cadastro')) {
         window.location.href = '/login'; 
      }
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro na requisição: ${response.status}`);
    }

    if (response.status === 204) return {} as T;
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export const apiUpload = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('edari_token');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      body: formData
    });

    if (response.status === 401) {
       localStorage.removeItem('edari_token');
       throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (!response.ok) throw new Error(`Erro no upload: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Upload Error [${endpoint}]:`, error);
    throw error;
  }
};
