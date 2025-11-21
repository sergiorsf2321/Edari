
import { User, Role } from "../types";
import { MOCK_USERS } from "../data/mocks";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AuthService = {
  login: async (email: string, role: Role): Promise<User | null> => {
    await delay(800); // Simula delay de rede
    const user = MOCK_USERS.find(u => u.email === email && u.role === role);
    if (user) {
      // Salva uma "sessão" fake
      localStorage.setItem('edari_token', `fake-jwt-token-${user.id}`);
      localStorage.setItem('edari_user_id', user.id);
      return user;
    }
    throw new Error('Credenciais inválidas. Tente novamente.');
  },

  register: async (userData: Partial<User>): Promise<void> => {
    await delay(1000);
    // Verifica se já existe
    if (MOCK_USERS.find(u => u.email === userData.email)) {
        throw new Error('E-mail já cadastrado.');
    }
    
    const newUser = { 
        ...userData, 
        id: `user-${Date.now()}`, 
        role: Role.Client, 
        isVerified: false 
    } as User;
    
    MOCK_USERS.push(newUser);
  },

  verifyEmail: async (email: string): Promise<void> => {
     await delay(500);
     const user = MOCK_USERS.find(u => u.email === email);
     if (user) {
         user.isVerified = true;
     }
  },

  getCurrentUser: async (): Promise<User | null> => {
    // Simula verificação de token
    const token = localStorage.getItem('edari_token');
    const userId = localStorage.getItem('edari_user_id');
    
    if (token && userId) {
        const user = MOCK_USERS.find(u => u.id === userId);
        return user || null;
    }
    return null;
  },
  
  socialLogin: async (provider: 'google' | 'apple', token: string): Promise<User> => {
      await delay(1000);
      // Simula login social bem sucedido sempre retornando ou criando o usuário mockado da Ana
      // Em um cenário real, decodificaria o token.
      
      // Verifica se já existe um usuário "Social" simulado, se não, usa a Ana ou cria um novo
      let user = MOCK_USERS.find(u => u.email === 'ana@cliente.com');
      
      if (!user) {
          user = {
              id: 'user-social-1',
              name: 'Usuário Social',
              email: 'social@email.com',
              role: Role.Client,
              isVerified: true,
              picture: 'https://i.pravatar.cc/150?u=social'
          };
          MOCK_USERS.push(user);
      }

      localStorage.setItem('edari_token', `fake-social-token-${provider}`);
      localStorage.setItem('edari_user_id', user.id);
      return user;
  },
  
  updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
      await delay(600);
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
      if (userIndex > -1) {
          MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...data };
          return MOCK_USERS[userIndex];
      }
      throw new Error("Usuário não encontrado");
  }
};
