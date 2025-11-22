import { User, Role } from "../types";
import { apiRequest } from "./api";

export const AuthService = {
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await apiRequest<{ token: string, user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      // A resposta já vem extraída do 'data' pelo apiRequest
      localStorage.setItem('edari_token', response.token);
      localStorage.setItem('edari_user_id', response.user.id);
      return response.user;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Verificar se é erro de email não verificado
      if (error.message?.includes('EMAIL_NOT_VERIFIED') || 
          error.message?.includes('E-mail não verificado')) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }
      throw new Error('Falha no login. Verifique suas credenciais.');
    }
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    cpf?: string;
    birthDate?: string;
    address?: string;
    phone?: string;
  }): Promise<void> => {
    const response = await apiRequest<{ token: string, user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    localStorage.setItem('edari_token', response.token);
    localStorage.setItem('edari_user_id', response.user.id);
  },

  verifyEmail: async (email: string): Promise<void> => {
    await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem('edari_token');
      if (!token) {
        console.log('No token found');
        return null;
      }
      
      const response = await apiRequest<{ user: User }>('/auth/me');
      return response.user;
    } catch (error) {
      console.error('Error getting current user:', error);
      // Se houver erro, limpar storage
      localStorage.removeItem('edari_token');
      localStorage.removeItem('edari_user_id');
      return null;
    }
  },
  
  socialLogin: async (provider: 'google' | 'apple', token: string): Promise<User> => {
    const response = await apiRequest<{ token: string, user: User }>('/auth/social', {
      method: 'POST',
      body: JSON.stringify({ provider, token })
    });
    
    localStorage.setItem('edari_token', response.token);
    localStorage.setItem('edari_user_id', response.user.id);
    return response.user;
  },
  
  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await apiRequest<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response.user;
  },
  
  forgotPassword: async (email: string): Promise<void> => {
    await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
};
