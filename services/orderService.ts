import { Order, UploadedFile, Message } from "../types";
import { apiRequest, apiUpload } from "./api";

export const OrderService = {
  getOrders: async (): Promise<Order[]> => {
    // Converte strings de data para objetos Date
    const orders = await apiRequest<any[]>('/orders');
    return orders.map(o => ({
        ...o,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
        paymentConfirmedAt: o.paymentConfirmedAt ? new Date(o.paymentConfirmedAt) : undefined
    }));
  },

  createOrder: async (orderData: Omit<Order, 'id'>): Promise<Order> => {
    const payload = {
        serviceId: orderData.service.id,
        description: orderData.description,
        details: (orderData as any).details || {} // Assume que detalhes vêm do form
    };
    return await apiRequest<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
  },

  updateOrder: async (order: Order): Promise<Order> => {
    return await apiRequest<Order>(`/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify(order)
    });
  },

  uploadFile: async (file: File, orderId: string): Promise<UploadedFile> => {
      const formData = new FormData();
      formData.append('file', file);
      const doc = await apiUpload<{ name: string, size: number, mimeType: string, s3Key: string }>(`/orders/${orderId}/upload`, formData);
      return { name: doc.name, size: doc.size, type: doc.mimeType };
  },
  
  sendMessage: async (orderId: string, content: string, attachmentId?: string): Promise<Message> => {
      return await apiRequest<Message>(`/orders/${orderId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content })
      });
  }
};