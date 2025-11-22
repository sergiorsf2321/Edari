import { User, Role } from "../types";
import { apiRequest } from "./api";

export const AuthService = {
  login: async (email: string, role: Role, password?: string): Promise<User | null> => {
    const response = await apiRequest<{ token: string, user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }) 
    });
    
    localStorage.setItem('edari_token', response.token);
    localStorage.setItem('edari_user_id', response.user.id);
    return response.user;
  },

  register: async (userData: Partial<User> & { password?: string }): Promise<void> => {
    const response = await apiRequest<{ token: string, user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData) 
    });
    localStorage.setItem('edari_token', response.token);
    localStorage.setItem('edari_user_id', response.user.id);
  },

  // Nova função necessária para o AdminDashboard
  getUsersByRole: async (role: Role): Promise<User[]> => {
      return await apiRequest<User[]>(`/users?role=${role}`);
  },

  checkServerStatus: async (): Promise<{ online: boolean, userCount: number }> => {
      try {
          return await apiRequest<{ online: boolean, userCount: number }>('/status');
      } catch (e) {
          return { online: false, userCount: 0 };
      }
  },

  verifyEmail: async (email: string): Promise<void> => {
      await apiRequest('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email }) });
  },

  getCurrentUser: async (): Promise<User | null> => {
     const token = localStorage.getItem('edari_token');
     if (!token) return null;

     try {
         const user = await apiRequest<User>('/auth/me');
         return user;
     } catch (error) {
         localStorage.removeItem('edari_token');
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
      return await apiRequest<User>('/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify(data)
      });
  }
};