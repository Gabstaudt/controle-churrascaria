
export interface User {
  id: string;
  name: string;
  code: string;
  password: string;
  role: 'employee' | 'admin';
  profileId?: string;
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
  code: string;
  name: string;
  category: string;
  description: string;
  price: number;
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

export type StockItem = FreezerItem;

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

export interface UserProfile {
  id: string;
  name: string;
  role: 'employee' | 'admin';
  permissions: UserPermissions;
  isSystem?: boolean;
  createdAt: string;
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

function normalizeText(value: string) {
  return (value || '').trim().toUpperCase();
}

function toProductCode(value: string) {
  const base = normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'PRODUTO';
}

// Users
export function getUsers(): User[] {
  return get<User[]>('churras_users', []);
}
export function setUsers(users: User[]) { set('churras_users', users); }
export function getUserByCode(code: string) { return getUsers().find(u => u.code === code); }
export function getUserProfiles(): UserProfile[] { return get<UserProfile[]>('churras_profiles', []); }
export function setUserProfiles(profiles: UserProfile[]) { set('churras_profiles', profiles); }

export function initDefaultProfiles() {
  const profiles = getUserProfiles();
  const adminProfile = profiles.find(p => p.role === 'admin' && p.name === 'Administrador');
  const employeeProfile = profiles.find(p => p.role === 'employee' && p.name === 'Funcionario');

  if (!adminProfile) {
    profiles.push({
      id: uid(),
      name: 'Administrador',
      role: 'admin',
      permissions: { ...DEFAULT_ADMIN_PERMISSIONS },
      isSystem: true,
      createdAt: now(),
    });
  }
  if (!employeeProfile) {
    profiles.push({
      id: uid(),
      name: 'Funcionario',
      role: 'employee',
      permissions: { ...DEFAULT_EMPLOYEE_PERMISSIONS },
      isSystem: true,
      createdAt: now(),
    });
  }

  setUserProfiles(profiles);
}
export function getActiveEmployeeByCode(code: string) {
  const normalized = code.trim().toLowerCase();
  return getUsers().find(
    u => u.code.trim().toLowerCase() === normalized && u.role === 'employee' && u.status === 'active',
  );
}

export function getActiveEmployeeByCredentials(code: string, password: string) {
  const normalizedCode = code.trim().toLowerCase();
  const normalizedPassword = password.trim();
  return getUsers().find(
    u =>
      u.code.trim().toLowerCase() === normalizedCode &&
      u.password === normalizedPassword &&
      u.role === 'employee' &&
      u.status === 'active',
  );
}

export function initDefaultAdmin() {
  initDefaultProfiles();
  const profiles = getUserProfiles();
  const adminProfile = profiles.find(p => p.role === 'admin');
  const employeeProfile = profiles.find(p => p.role === 'employee');
  const users = getUsers();
  const adminByCode = users.find(u => u.code === DEFAULT_ADMIN_CREDENTIALS.code);
  if (adminByCode) {
    adminByCode.password = DEFAULT_ADMIN_CREDENTIALS.password;
    adminByCode.role = 'admin';
    adminByCode.profileId = adminProfile?.id;
    adminByCode.status = 'active';
    adminByCode.permissions = adminProfile ? { ...adminProfile.permissions } : { ...DEFAULT_ADMIN_PERMISSIONS };
  } else {
    users.push({
      id: uid(), name: 'Administrador', code: DEFAULT_ADMIN_CREDENTIALS.code, password: DEFAULT_ADMIN_CREDENTIALS.password,
      role: 'admin', profileId: adminProfile?.id, position: 'Gerente', status: 'active', baseSalary: 5000,
      createdAt: now(), permissions: adminProfile ? { ...adminProfile.permissions } : { ...DEFAULT_ADMIN_PERMISSIONS },
    });
  }

  const employeeByCode = users.find(u => u.code === DEFAULT_EMPLOYEE_CREDENTIALS.code);
  if (!employeeByCode) {
    users.push({
      id: uid(),
      name: 'Funcionario Exemplo',
      code: DEFAULT_EMPLOYEE_CREDENTIALS.code,
      password: DEFAULT_EMPLOYEE_CREDENTIALS.password,
      role: 'employee', profileId: employeeProfile?.id,
      position: 'Atendente',
      status: 'active',
      baseSalary: 1800,
      createdAt: now(),
      permissions: employeeProfile ? { ...employeeProfile.permissions } : { ...DEFAULT_EMPLOYEE_PERMISSIONS },
    });
  }

  setUsers(users);
}

// Products
export function getProducts(): Product[] {
  const products = get<Product[]>('churras_products', []);
  return products.map(p => ({
    ...p,
    code: normalizeText(p.code || toProductCode(`${p.name}-${p.id.slice(0, 4)}`)),
    price: Number.isFinite(p.price) ? p.price : 0,
  }));
}
export function setProducts(p: Product[]) { set('churras_products', p); }

export function getApprovedProducts(): Product[] {
  return getProducts().filter(p => p.status === 'approved');
}

export function findApprovedProductByQuery(query: string): { product: Product | null; ambiguous: boolean } {
  const normalizedQuery = normalizeText(query);
  const products = getApprovedProducts();

  const exact = products.filter(
    p => normalizeText(p.code) === normalizedQuery || normalizeText(p.name) === normalizedQuery,
  );
  if (exact.length > 0) return { product: exact[0], ambiguous: false };

  const partial = products.filter(
    p => normalizeText(p.code).includes(normalizedQuery) || normalizeText(p.name).includes(normalizedQuery),
  );
  if (partial.length === 1) return { product: partial[0], ambiguous: false };
  if (partial.length > 1) return { product: null, ambiguous: true };
  return { product: null, ambiguous: false };
}

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

function normalizeStockItems(items: StockItem[]): StockItem[] {
  const merged = new Map<string, StockItem>();
  for (const item of items) {
    if (!item) continue;
    const code = (item.productCode || item.productName || '').trim().toUpperCase();
    const name = (item.productName || code).trim();
    const qty = Number(item.quantity) || 0;
    if (!code || qty <= 0) continue;

    const existing = merged.get(code);
    if (existing) {
      existing.quantity += qty;
      if (name && (!existing.productName || existing.productName === existing.productCode)) {
        existing.productName = name;
      }
    } else {
      merged.set(code, {
        productId: item.productId || uid(),
        productCode: code,
        productName: name || code,
        quantity: qty,
      });
    }
  }
  return Array.from(merged.values());
}

export function getStockItems(): StockItem[] {
  const stock = get<StockItem[]>('churras_stock', []);
  if (stock.length > 0) return normalizeStockItems(stock);

  // Backward compatibility: migrate old per-freezer stock to a single stock list.
  const fromFreezers = getFreezers().flatMap(f => f.items || []);
  const migrated = normalizeStockItems(fromFreezers);
  if (migrated.length > 0) set('churras_stock', migrated);
  return migrated;
}

export function setStockItems(items: StockItem[]) {
  set('churras_stock', normalizeStockItems(items));
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
