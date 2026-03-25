import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Package, ClipboardList, Users, ShoppingCart,
  DollarSign, Calendar, Phone, FileText, StickyNote, FolderOpen,
  Settings, LogOut, Menu, X, Flame
} from 'lucide-react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import StockModule from '@/components/admin/StockModule';
import AuditModule from '@/components/admin/AuditModule';
import UsersModule from '@/components/admin/UsersModule';
import ProductsModule from '@/components/admin/ProductsModule';
import CashModule from '@/components/admin/CashModule';
import CalendarModule from '@/components/admin/CalendarModule';
import PhonebookModule from '@/components/admin/PhonebookModule';
import LicensesModule from '@/components/admin/LicensesModule';
import NotesModule from '@/components/admin/NotesModule';
import DocumentsModule from '@/components/admin/DocumentsModule';
import SettingsModule from '@/components/admin/SettingsModule';

const modules = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: null },
  { id: 'stock', label: 'Estoque', icon: Package, perm: 'stock' as const },
  { id: 'audit', label: 'Auditoria', icon: ClipboardList, perm: 'audit' as const },
  { id: 'users', label: 'Usuários/RH', icon: Users, perm: 'hr' as const },
  { id: 'products', label: 'Produtos', icon: ShoppingCart, perm: 'approveProducts' as const },
  { id: 'cash', label: 'Caixa', icon: DollarSign, perm: 'cashRegister' as const },
  { id: 'calendar', label: 'Agenda', icon: Calendar, perm: 'calendar' as const },
  { id: 'phonebook', label: 'Telefones', icon: Phone, perm: 'phonebook' as const },
  { id: 'licenses', label: 'Licenças', icon: FileText, perm: 'licenses' as const },
  { id: 'notes', label: 'Anotações', icon: StickyNote, perm: 'notes' as const },
  { id: 'documents', label: 'Documentos', icon: FolderOpen, perm: 'documents' as const },
  { id: 'settings', label: 'Configurações', icon: Settings, perm: null },
];

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleModules = modules.filter(m => !m.perm || user?.permissions[m.perm]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <AdminDashboard onNavigate={setActiveModule} />;
      case 'stock': return <StockModule />;
      case 'audit': return <AuditModule />;
      case 'users': return <UsersModule />;
      case 'products': return <ProductsModule />;
      case 'cash': return <CashModule />;
      case 'calendar': return <CalendarModule />;
      case 'phonebook': return <PhonebookModule />;
      case 'licenses': return <LicensesModule />;
      case 'notes': return <NotesModule />;
      case 'documents': return <DocumentsModule />;
      case 'settings': return <SettingsModule />;
      default: return <AdminDashboard onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-background/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Flame className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-display font-bold text-foreground text-sm">Churrascaria</h1>
            <p className="text-xs text-muted-foreground">{user?.name}</p>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100vh-130px)]">
          {visibleModules.map(m => {
            const Icon = m.icon;
            return (
              <button key={m.id} onClick={() => { setActiveModule(m.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeModule === m.id
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}>
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen">
        <header className="glass-card rounded-none p-4 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></Button>
          <span className="font-display font-semibold text-foreground">
            {visibleModules.find(m => m.id === activeModule)?.label || 'Dashboard'}
          </span>
        </header>
        <div className="p-4 lg:p-6 animate-fade-in">{renderModule()}</div>
      </main>
    </div>
  );
}
