import { AuthContextType } from "../types";

// ALTERE ESTA URL APÓS O DEPLOY DO BACKEND
const PROD_API_URL = 'https://edari-api.onrender.com'; 

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

    if (response.status === 401) {
      localStorage.removeItem('edari_token');
      window.location.href = '/'; // Redireciona para login
      throw new Error('Sessão expirada.');
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

    if (!response.ok) throw new Error(`Erro no upload: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Upload Error [${endpoint}]:`, error);
    throw error;
  }
};
