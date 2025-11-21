
import { Order, UploadedFile, Message } from "../types";
import { MOCK_ORDERS } from "../data/mocks";
import { NotificationService } from "./notificationService";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const OrderService = {
  getOrders: async (): Promise<Order[]> => {
    await delay(500); // Simula delay
    // Retorna uma cópia para garantir imutabilidade no react se necessário, 
    // mas aqui mantemos referência para simular persistência na sessão
    return [...MOCK_ORDERS]; 
  },

  createOrder: async (orderData: Omit<Order, 'id'>): Promise<Order> => {
    await delay(1000);
    const newOrder = { 
        ...orderData, 
        id: `ORD-${Math.floor(Math.random() * 10000)}`,
        createdAt: new Date(),
        updatedAt: new Date()
    } as Order;
    
    MOCK_ORDERS.unshift(newOrder); // Adiciona no topo
    return newOrder;
  },

  updateOrder: async (order: Order): Promise<Order> => {
    await delay(600);
    const index = MOCK_ORDERS.findIndex(o => o.id === order.id);
    if (index !== -1) {
        const oldOrder = MOCK_ORDERS[index];
        const oldStatus = oldOrder.status;
        
        const updatedOrder = { ...order, updatedAt: new Date() };
        MOCK_ORDERS[index] = updatedOrder;
        
        // Se o status mudou, dispara notificação
        if (oldStatus !== updatedOrder.status) {
            NotificationService.sendOrderStatusUpdate(updatedOrder, oldStatus);
        }

        return updatedOrder;
    }
    throw new Error("Pedido não encontrado");
  },

  uploadFile: async (file: File, orderId: string): Promise<UploadedFile> => {
      await delay(1500); // Simula upload lento
      // Retorna um objeto fake de arquivo hospedado
      return {
          name: file.name,
          size: file.size,
          type: file.type
      };
  },
  
  sendMessage: async (orderId: string, content: string, attachmentId?: string): Promise<Message> => {
      await delay(300);
      throw new Error("Método sendMessage simulado deve ser tratado via updateOrder na simulação");
  }
};
