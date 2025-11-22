import { User, Role } from "../types";
import { apiRequest } from "./api";

export const AuthService = {
  login: async (email: string, password: string, role?: Role): Promise<{user: User, token: string}> => {
    const response = await apiRequest<{ data: { token: string, user: User } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }) 
    });
    
    localStorage.setItem('edari_token', response.data.token);
    localStorage.setItem('edari_user_id', response.data.user.id);
    localStorage.setItem('edari_user_role', response.data.user.role);
    
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
    cpf?: string;
    birthDate?: string;
    address?: string;
    phone?: string;
  }): Promise<{user: User, token: string}> => {
    const response = await apiRequest<{ data: { token: string, user: User } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData) 
    });
    
    localStorage.setItem('edari_token', response.data.token);
    localStorage.setItem('edari_user_id', response.data.user.id);
    localStorage.setItem('edari_user_role', response.data.user.role);
    
    return response.data;
  },

  getUsersByRole: async (role: Role): Promise<User[]> => {
    const response = await apiRequest<{ data: User[] }>(`/users?role=${role}`);
    return response.data;
  },

  checkServerStatus: async (): Promise<{ online: boolean; userCount: number }> => {
    try {
      const response = await apiRequest<{ online: boolean; userCount: number }>('/status');
      return response;
    } catch (e) {
      return { online: false, userCount: 0 };
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('edari_token');
    if (!token) return null;

    try {
      const response = await apiRequest<{ data: User }>('/auth/me');
      return response.data;
    } catch (error) {
      // Token inválido - limpar storage
      localStorage.removeItem('edari_token');
      localStorage.removeItem('edari_user_id');
      localStorage.removeItem('edari_user_role');
      return null;
    }
  },

  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await apiRequest<{ data: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem('edari_token');
    localStorage.removeItem('edari_user_id');
    localStorage.removeItem('edari_user_role');
  }
};