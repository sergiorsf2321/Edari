export enum Role {
  Client = 'CLIENT',
  Analyst = 'ANALYST',
  Admin = 'ADMIN',
}

export enum Page {
  Landing,
  Login,
  Order,
  Dashboard,
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export enum ServiceId {
  Exam = 'exam',
  Adaptation = 'adaptation',
  Express = 'express',
  Consulting = 'consulting',
}

export interface Service {
  id: ServiceId;
  name: string;
  description: string;
  price: number | null;
  duration: string;
  features: string[];
}

export enum OrderStatus {
  Pending = 'PENDING',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Canceled = 'CANCELED',
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export interface Order {
  id: string;
  client: User;
  service: Service;
  analyst?: User;
  status: OrderStatus;
  isUrgent: boolean;
  propertyType: string;
  documents: UploadedFile[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
  report?: UploadedFile;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
  page: Page;
  setPage: (page: Page) => void;
}