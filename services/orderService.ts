
import { Order, UploadedFile, Message } from "../types";
import { apiRequest, apiUpload } from "./api";

export const OrderService = {
  getOrders: async (): Promise<Order[]> => {
    const orders = await apiRequest<any[]>('/orders');
    return orders.map(o => ({
        ...o,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
        paymentConfirmedAt: o.paymentConfirmedAt ? new Date(o.paymentConfirmedAt) : undefined,
        total: Number(o.totalAmount || o.total || 0)
    }));
  },

  createOrder: async (orderData: Omit<Order, 'id'>): Promise<Order> => {
    const payload = {
        serviceId: orderData.service.id,
        description: orderData.description,
        details: (orderData as any).details || {} 
    };
    const order = await apiRequest<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return {
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        total: Number(order.totalAmount)
    };
  },

  updateOrder: async (order: Order): Promise<Order> => {
    // Envia apenas campos alteráveis
    const payload = {
        status: order.status,
        totalAmount: order.total,
        analystId: order.analyst?.id
    };
    const updated = await apiRequest<any>(`/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });
    return {
        ...updated,
        createdAt: new Date(updated.createdAt),
        updatedAt: new Date(updated.updatedAt),
        total: Number(updated.totalAmount)
    };
  },

  uploadFile: async (file: File, orderId: string): Promise<UploadedFile> => {
      const formData = new FormData();
      formData.append('file', file);
      
      const doc = await apiUpload<{ name: string, size: number, mimeType: string, s3Key: string }>(`/orders/${orderId}/upload`, formData);
      
      return { name: doc.name, size: doc.size, type: doc.mimeType };
  },
  
  sendMessage: async (orderId: string, content: string, attachmentId?: string): Promise<Message> => {
      const msg = await apiRequest<any>(`/orders/${orderId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content })
      });
      return {
          ...msg,
          createdAt: new Date(msg.createdAt)
      };
  }
};
