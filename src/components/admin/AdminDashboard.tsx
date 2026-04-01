import {
  getStockItems, getProducts, getUsers, getAuditLogs, getCalendarEvents, getLicenses,
} from '@/lib/store';
import { Package, Users, ClipboardList, AlertTriangle, Calendar, ShoppingCart } from 'lucide-react';

export default function AdminDashboard({ onNavigate }: { onNavigate: (id: string) => void }) {
  const stockItems = getStockItems();
  const products = getProducts();
  const users = getUsers();
  const logs = getAuditLogs();
  const events = getCalendarEvents();
  const licenses = getLicenses();

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.timestamp.startsWith(today));
  const pendingProducts = products.filter(p => p.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'active');
  const pendingEvents = events.filter(e => e.status === 'pending');
  const stockUnits = stockItems.reduce((sum, item) => sum + item.quantity, 0);

  const expiringLicenses = licenses.filter(l => {
    if (l.status === 'expired') return true;
    const expiry = new Date(l.expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
    return daysLeft <= l.alertDays && daysLeft >= 0;
  });

  const stats = [
    { label: 'Movimentacoes Hoje', value: todayLogs.length, icon: ClipboardList, color: 'text-info' },
    { label: 'Produtos Cadastrados', value: products.filter(p => p.status === 'approved').length, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Funcionarios Ativos', value: activeUsers.length, icon: Users, color: 'text-success' },
    { label: 'Itens em Estoque', value: stockItems.length, icon: Package, color: 'text-info' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card p-4">
              <Icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-foreground mb-2">Resumo do Estoque</h3>
        <p className="text-sm text-muted-foreground">Total de unidades: <span className="text-foreground font-medium">{stockUnits}</span></p>
      </div>

      {expiringLicenses.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-l-destructive">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-display font-semibold text-foreground">Alertas de Licencas</h3>
          </div>
          {expiringLicenses.map(l => (
            <p key={l.id} className="text-sm text-muted-foreground">
              <span className="text-destructive font-medium">{l.name}</span> - Vencimento: {new Date(l.expiryDate).toLocaleDateString('pt-BR')}
            </p>
          ))}
          <button onClick={() => onNavigate('licenses')} className="text-xs text-primary mt-2 hover:underline">Ver todas {'->'}</button>
        </div>
      )}

      {pendingEvents.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-l-warning">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-warning" />
            <h3 className="font-display font-semibold text-foreground">Tarefas Pendentes</h3>
          </div>
          {pendingEvents.slice(0, 5).map(e => (
            <p key={e.id} className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{e.title}</span> - {e.date}
            </p>
          ))}
          <button onClick={() => onNavigate('calendar')} className="text-xs text-primary mt-2 hover:underline">Ver agenda {'->'}</button>
        </div>
      )}

      {pendingProducts.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-l-primary">
          <h3 className="font-display font-semibold text-foreground mb-2">Produtos Pendentes ({pendingProducts.length})</h3>
          {pendingProducts.slice(0, 3).map(p => (
            <p key={p.id} className="text-sm text-muted-foreground">{p.name} - por {p.createdBy}</p>
          ))}
          <button onClick={() => onNavigate('products')} className="text-xs text-primary mt-2 hover:underline">Ver produtos {'->'}</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'stock', label: 'Estoque', icon: Package },
          { id: 'users', label: 'Usuarios/RH', icon: Users },
          { id: 'cash', label: 'Caixa', icon: ClipboardList },
          { id: 'audit', label: 'Auditoria', icon: ClipboardList },
        ].map(m => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => onNavigate(m.id)}
              className="glass-card p-4 hover:border-primary/50 transition-colors text-left">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold text-foreground">{m.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
