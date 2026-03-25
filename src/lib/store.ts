
export interface User {
  id: string;
  name: string;
  code: string;
  password: string;
  role: 'employee' | 'admin';
  position: string;
  status: 'active' | 'inactive';
  baseSalary: number;
  createdBy?: string;
  createdAt: string;
  permissions: UserPermissions;
}

export interface UserPermissions {
  stock: boolean;
  audit: boolean;
  hr: boolean;
  cashRegister: boolean;
  licenses: boolean;
  documents: boolean;
  notes: boolean;
  calendar: boolean;
  phonebook: boolean;
  approveProducts: boolean;
  exportData: boolean;
  manageUsers: boolean;
}

export const DEFAULT_EMPLOYEE_PERMISSIONS: UserPermissions = {
  stock: false, audit: false, hr: false, cashRegister: false,
  licenses: false, documents: false, notes: false, calendar: false,
  phonebook: false, approveProducts: false, exportData: false, manageUsers: false,
};

export const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  stock: true, audit: true, hr: true, cashRegister: true,
  licenses: true, documents: true, notes: true, calendar: true,
  phonebook: true, approveProducts: true, exportData: true, manageUsers: true,
};

export const DEFAULT_ADMIN_CREDENTIALS = {
  code: 'admin',
  password: 'admin123',
};

export const DEFAULT_EMPLOYEE_CREDENTIALS = {
  code: 'funcionario',
  password: 'func123',
};

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected';
  createdBy: string;
  createdAt: string;
  history: { action: string; by: string; at: string }[];
}

export interface FreezerItem {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
}

export interface Freezer {
  id: number;
  items: FreezerItem[];
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
  freezerId?: number;
  timestamp: string;
  type: 'stock' | 'user' | 'permission' | 'system' | 'product' | 'cash' | 'other';
}

export interface Voucher {
  id: string;
  type: string;
  value: number;
  date: string;
  description: string;
}

export interface PayrollItem {
  id: string;
  description: string;
  value: number;
  type: 'credit' | 'debit';
  date: string;
}

export interface CashEntry {
  id: string;
  category: string;
  description: string;
  value: number;
  type: 'income' | 'expense';
  timestamp: string;
}

export interface CashClosing {
  id: string;
  date: string;
  entries: CashEntry[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  manualCount: number;
  notes: string;
  closedBy: string;
  closedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  responsible: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'done';
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  phones: string[];
  email: string;
  address: string;
  category: 'supplier' | 'client' | 'partner' | 'employee' | 'other';
  notes: string;
}

export interface License {
  id: string;
  name: string;
  protocol: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expired' | 'renewing';
  alertDays: number;
  notes: string;
  attachments: { name: string; url: string }[];
  renewalHistory: { date: string; notes: string }[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  freezerCount: number;
  productCategories: string[];
  cashCategories: string[];
  defaultAlertDays: number;
}

// Helper functions
function get<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// Users
export function getUsers(): User[] {
  return get<User[]>('churras_users', []);
}
export function setUsers(users: User[]) { set('churras_users', users); }
export function getUserByCode(code: string) { return getUsers().find(u => u.code === code); }
export function getActiveEmployeeByCode(code: string) {
  const normalized = code.trim().toLowerCase();
  return getUsers().find(
    u => u.code.trim().toLowerCase() === normalized && u.role === 'employee' && u.status === 'active',
  );
}

export function initDefaultAdmin() {
  const users = getUsers();
  const adminByCode = users.find(u => u.code === DEFAULT_ADMIN_CREDENTIALS.code);
  if (adminByCode) {
    adminByCode.password = DEFAULT_ADMIN_CREDENTIALS.password;
    adminByCode.role = 'admin';
    adminByCode.status = 'active';
    adminByCode.permissions = { ...DEFAULT_ADMIN_PERMISSIONS };
  } else {
    users.push({
      id: uid(), name: 'Administrador', code: DEFAULT_ADMIN_CREDENTIALS.code, password: DEFAULT_ADMIN_CREDENTIALS.password,
      role: 'admin', position: 'Gerente', status: 'active', baseSalary: 5000,
      createdAt: now(), permissions: { ...DEFAULT_ADMIN_PERMISSIONS },
    });
  }

  const employeeByCode = users.find(u => u.code === DEFAULT_EMPLOYEE_CREDENTIALS.code);
  if (!employeeByCode) {
    users.push({
      id: uid(),
      name: 'Funcionario Exemplo',
      code: DEFAULT_EMPLOYEE_CREDENTIALS.code,
      password: DEFAULT_EMPLOYEE_CREDENTIALS.password,
      role: 'employee',
      position: 'Atendente',
      status: 'active',
      baseSalary: 1800,
      createdAt: now(),
      permissions: { ...DEFAULT_EMPLOYEE_PERMISSIONS },
    });
  }

  setUsers(users);
}

// Products
export function getProducts(): Product[] { return get('churras_products', []); }
export function setProducts(p: Product[]) { set('churras_products', p); }

// Freezers
export function getFreezers(): Freezer[] { return get('churras_freezers', []); }
export function setFreezers(f: Freezer[]) { set('churras_freezers', f); }
export function ensureFreezers(count: number) {
  const existing = getFreezers();
  const freezers: Freezer[] = [];
  for (let i = 1; i <= count; i++) {
    freezers.push(existing.find(f => f.id === i) || { id: i, items: [] });
  }
  setFreezers(freezers);
  return freezers;
}

// Audit
export function getAuditLogs(): AuditLog[] { return get('churras_audit', []); }
export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const logs = getAuditLogs();
  logs.unshift({ ...log, id: uid(), timestamp: now() });
  set('churras_audit', logs);
}

// Vouchers per user
export function getVouchers(userId: string): Voucher[] { return get(`churras_vouchers_${userId}`, []); }
export function setVouchers(userId: string, v: Voucher[]) { set(`churras_vouchers_${userId}`, v); }

// Payroll items per user
export function getPayrollItems(userId: string): PayrollItem[] { return get(`churras_payroll_${userId}`, []); }
export function setPayrollItems(userId: string, items: PayrollItem[]) { set(`churras_payroll_${userId}`, items); }

// Cash
export function getCashClosings(): CashClosing[] { return get('churras_cash', []); }
export function setCashClosings(c: CashClosing[]) { set('churras_cash', c); }

// Calendar
export function getCalendarEvents(): CalendarEvent[] { return get('churras_calendar', []); }
export function setCalendarEvents(e: CalendarEvent[]) { set('churras_calendar', e); }

// Contacts
export function getContacts(): Contact[] { return get('churras_contacts', []); }
export function setContacts(c: Contact[]) { set('churras_contacts', c); }

// Licenses
export function getLicenses(): License[] { return get('churras_licenses', []); }
export function setLicenses(l: License[]) { set('churras_licenses', l); }

// Notes
export function getNotes(): Note[] { return get('churras_notes', []); }
export function setNotes(n: Note[]) { set('churras_notes', n); }

// Config
export function getConfig(): SystemConfig {
  return get('churras_config', {
    freezerCount: 5,
    productCategories: ['Carnes', 'Bebidas', 'Acompanhamentos', 'Sobremesas', 'Outros'],
    cashCategories: ['Vendas', 'Sangria', 'Suprimento', 'Despesas', 'Outros'],
    defaultAlertDays: 30,
  });
}
export function setConfig(c: SystemConfig) { set('churras_config', c); }
