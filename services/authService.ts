
import { User, Role } from "../types";
import { apiRequest } from "./api";

export const AuthService = {
  login: async (email: string, role: Role): Promise<User | null> => {
    const response = await apiRequest<{ token: string, user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'password_do_form' }) 
    });
    
    localStorage.setItem('edari_token', response.token);
    localStorage.setItem('edari_user_id', response.user.id);
    return response.user;
  },

  // Função de Diagnóstico
  checkServerStatus: async (): Promise<{ online: boolean, userCount: number }> => {
      try {
          return await apiRequest<{ online: boolean, userCount: number }>('/status');
      } catch (e) {
          return { online: false, userCount: 0 };
      }
  },

  register: async (userData: Partial<User>): Promise<void> => {
    const response = await apiRequest<{ token: string, user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...userData, password: 'password_do_form' }) 
    });
    localStorage.setItem('edari_token', response.token);
    localStorage.setItem('edari_user_id', response.user.id);
  },

  verifyEmail: async (email: string): Promise<void> => {
      await apiRequest('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email }) });
  },

  getCurrentUser: async (): Promise<User | null> => {
     return null; 
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
      return await apiRequest<User>('/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify(data)
      });
  }
};
