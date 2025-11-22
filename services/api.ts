const PROD_API_URL = 'https://edari-api.onrender.com/api'; 

export const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : PROD_API_URL;

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('edari_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export class ApiError extends Error {
  code?: string;
  status: number;
  
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };

  try {
    const response = await fetch(url, { ...options, headers });

    let errorBody: any = {};
    if (!response.ok) {
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: `Erro ${response.status}` };
      }
    }

    if (response.status === 401) {
      if (endpoint.includes('/auth/login') || endpoint.includes('/auth/social') || endpoint.includes('/auth/register')) {
        throw new ApiError(errorBody.message || 'Credenciais inválidas.', 401, errorBody.code);
      }
      localStorage.removeItem('edari_token');
      localStorage.removeItem('edari_user_id');
      throw new ApiError('Sessão expirada. Por favor, faça login novamente.', 401, 'SESSION_EXPIRED');
    }

    if (response.status === 403) {
      throw new ApiError(errorBody.message || 'Acesso negado.', 403, errorBody.code);
    }

    if (!response.ok) {
      throw new ApiError(errorBody.message || `Erro na requisição: ${response.status}`, response.status, errorBody.code);
    }

    if (response.status === 204) return {} as T;
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(`API Error [${endpoint}]:`, error);
    throw new ApiError('Erro de conexão com o servidor.', 0, 'NETWORK_ERROR');
  }
};

export const apiUpload = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('edari_token');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });

    if (response.status === 401) {
      localStorage.removeItem('edari_token');
      throw new ApiError('Sessão expirada.', 401);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(errorBody.message || `Erro no upload: ${response.status}`, response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Erro ao fazer upload.', 0);
  }
};
