import { Order, UploadedFile, Message, OrderStatus } from "../types";
import { apiRequest, apiUpload } from "./api";
import { SERVICES } from "../constants";

const mapOrderFromApi = (apiOrder: any): Order => {
  const fullService = SERVICES.find(s => s.id === apiOrder.service?.id || s.id === apiOrder.serviceId);
  
  return {
    id: apiOrder.id,
    client: apiOrder.client,
    service: fullService || apiOrder.service || { id: apiOrder.serviceId, name: 'Serviço', price: null },
    analyst: apiOrder.analyst || undefined,
    status: apiOrder.status as OrderStatus,
    isUrgent: apiOrder.isUrgent || false,
    propertyType: apiOrder.propertyType || 'N/A',
    documents: (apiOrder.documents || []).map((d: any) => ({
      name: d.name,
      size: d.size,
      type: d.mimeType || d.type,
      s3Key: d.s3Key
    })),
    total: Number(apiOrder.totalAmount || apiOrder.total || 0),
    createdAt: new Date(apiOrder.createdAt),
    updatedAt: new Date(apiOrder.updatedAt),
    paymentConfirmedAt: apiOrder.paymentConfirmedAt ? new Date(apiOrder.paymentConfirmedAt) : undefined,
    description: apiOrder.description || '',
    messages: (apiOrder.messages || []).map((m: any) => ({
      id: m.id,
      sender: m.sender,
      content: m.content,
      createdAt: new Date(m.createdAt),
      attachment: m.attachment ? { name: m.attachment.name, size: m.attachment.size, type: m.attachment.mimeType } : undefined
    })),
    details: apiOrder.details
  };
};

export const OrderService = {
  getOrders: async (): Promise<Order[]> => {
    const orders = await apiRequest<any[]>('/orders');
    return orders.map(mapOrderFromApi);
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    const order = await apiRequest<any>(`/orders/${orderId}`);
    return mapOrderFromApi(order);
  },

  createOrder: async (orderData: Omit<Order, 'id'>): Promise<Order> => {
    const payload = {
      serviceId: typeof orderData.service === 'string' ? orderData.service : orderData.service.id,
      description: orderData.description,
      details: orderData.details || {}
    };
    const order = await apiRequest<any>('/orders', { method: 'POST', body: JSON.stringify(payload) });
    return mapOrderFromApi(order);
  },

  updateOrder: async (order: Order): Promise<Order> => {
    const payload: any = { status: order.status, totalAmount: order.total };
    if (order.analyst?.id) payload.analystId = order.analyst.id;
    const updated = await apiRequest<any>(`/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return mapOrderFromApi(updated);
  },

  setQuote: async (orderId: string, price: number): Promise<Order> => {
    const updated = await apiRequest<any>(`/orders/${orderId}/quote`, { method: 'PATCH', body: JSON.stringify({ price }) });
    return mapOrderFromApi(updated);
  },

  uploadFile: async (file: File, orderId: string): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const doc = await apiUpload<{ name: string; size: number; mimeType: string; s3Key: string }>(`/orders/${orderId}/upload`, formData);
    return { name: doc.name, size: doc.size, type: doc.mimeType, s3Key: doc.s3Key };
  },
  
  sendMessage: async (orderId: string, content: string, attachmentId?: string): Promise<Message> => {
    const msg = await apiRequest<any>(`/orders/${orderId}/messages`, { method: 'POST', body: JSON.stringify({ content, attachmentId }) });
    return {
      id: msg.id,
      sender: msg.sender,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
      attachment: msg.attachment ? { name: msg.attachment.name, size: msg.attachment.size, type: msg.attachment.mimeType } : undefined
    };
  }
};
