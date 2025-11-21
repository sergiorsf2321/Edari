import { AuthContextType } from "../types";

// URL base do Backend. Em desenvolvimento local, geralmente é localhost:3000 ou 8080.
// Em produção, será a URL do Render (ex: https://api.edari.com.br)
export const API_BASE_URL = 'http://localhost:3000/api'; 

// Helper para cabeçalhos de autenticação
const getAuthHeaders = () => {
  const token = localStorage.getItem('edari_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Wrapper genérico para chamadas de API
export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };

  try {
    const response = await fetch(url, { ...options, headers });

    // Tratamento de erro 401 (Não autorizado) - Token expirado ou inválido
    if (response.status === 401) {
      localStorage.removeItem('edari_token');
      // Opcional: Redirecionar para login ou disparar evento global
      // window.location.href = '/login';
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro na requisição: ${response.status}`);
    }

    // Se a resposta não tiver conteúdo (ex: 204 No Content)
    if (response.status === 204) return {} as T;

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Wrapper específico para Uploads (Multipart/Form-Data)
export const apiUpload = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('edari_token');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Não definimos Content-Type aqui, o navegador define automaticamente com o boundary correto para FormData
      },
      body: formData
    });

    if (!response.ok) throw new Error(`Erro no upload: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Upload Error [${endpoint}]:`, error);
    throw error;
  }
};