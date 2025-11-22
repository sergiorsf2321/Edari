import { User, Role } from "../types";
import { apiRequest } from "./api";

export const AuthService = {
  login: async (email: string, role: Role): Promise<User | null> => {
    // Em produção, a senha deve ser capturada no formulário de login
    const response = await apiRequest<{ token: string, user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'password_do_form' }) 
    });
    
    localStorage.setItem('edari_token', response.token);
    localStorage.setItem('edari_user_id', response.user.id);
    return response.user;
  },

  register: async (userData: Partial<User>): Promise<void> => {
    const response = await apiRequest<{ token: string, user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...userData, password: 'password_do_form' }) // Incluir senha no form de cadastro
    });
    localStorage.setItem('edari_token', response.token);
    localStorage.setItem('edari_user_id', response.user.id);
  },

  verifyEmail: async (email: string): Promise<void> => {},

  getCurrentUser: async (): Promise<User | null> => {
     // Em uma aplicação real, chamaria /api/auth/me
     // Por enquanto, retorna null para forçar login se token não for validado
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
