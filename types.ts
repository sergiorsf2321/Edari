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
}

export enum ServiceId {
  QualifiedSearch = 'qualified_search',
  DigitalCertificate = 'digital_certificate',
  PreAnalysis = 'pre_analysis',
  RegistryIntermediation = 'registry_intermediation', // Novo serviço
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

export interface AuthContextType {
  user: User | null;
  login: (email: string, role: Role) => void;
  registerUser: (name: string, email: string, cpf: string, birthDate: string, address: string) => void;
  verifyUser: (email: string) => void;
  logout: () => void;
  page: Page;
  setPage: (page: Page) => void;
  loginWithGoogle: (googleToken: string) => void;
  loginWithApple: (appleToken: string) => void;
  orders: Order[];
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  updateOrder: (updatedOrder: Order) => void;
  addOrder: (newOrderData: Omit<Order, 'id'>) => void;
  lastRegisteredEmail: string | null;
}