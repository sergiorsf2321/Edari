
export enum Role {
  Client = 'CLIENT',
  Analyst = 'ANALYST',
  Admin = 'ADMIN',
}

export enum Page {
  Landing,
  Login,
  StaffLogin,
  Signup,
  Order,
  Dashboard,
  OrderDetail,
  EmailConfirmation,
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  picture?: string;
  isVerified?: boolean;
  cpf?: string;
  birthDate?: string;
  address?: string;
  phone?: string;
}

export enum ServiceId {
  QualifiedSearch = 'qualified_search',
  DigitalCertificate = 'digital_certificate',
  PreAnalysis = 'pre_analysis',
  RegistryIntermediation = 'registry_intermediation',
  DocPreparation = 'doc_preparation',
  TechnicalReport = 'technical_report',
  DevolutionaryNoteAnalysis = 'devolutionary_note_analysis',
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
  AwaitingQuote = 'AWAITING_QUOTE',
  Pending = 'PENDING',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Canceled = 'CANCELED',
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  fileRef?: File; // Campo essencial para enviar o binário para o backend
}

export interface Message {
    id: string;
    sender: User;
    content: string;
    createdAt: Date;
    attachment?: UploadedFile;
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
  paymentConfirmedAt?: Date;
  report?: UploadedFile;
  description: string;
  messages: Message[];
}

export interface CardDetails {
    number: string;
    name: string;
    expiry: string;
    cvc: string;
}

export interface PixResponse {
    qrCodeUrl: string;
    pixCopyPaste: string;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role) => Promise<boolean>;
  registerUser: (name: string, email: string, cpf: string, birthDate: string, address: string, phone: string) => Promise<void>;
  verifyUser: (email: string) => void;
  logout: () => Promise<void>;
  page: Page;
  setPage: (page: Page) => void;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  orders: Order[];
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  updateOrder: (updatedOrder: Order) => void;
  addOrder: (newOrderData: Omit<Order, 'id'>) => void;
  lastRegisteredEmail: string | null;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  updateUserProfile: (data: Partial<User>) => void;
}