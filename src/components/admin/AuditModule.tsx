import { useState } from 'react';
import { getAuditLogs } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { exportCSV } from '@/lib/export-utils';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export default function AuditModule() {
  const logs = getAuditLogs();
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = logs.filter(l => {
    if (dateFilter && !l.timestamp.startsWith(dateFilter)) return false;
    if (userFilter && !l.userName.toLowerCase().includes(userFilter.toLowerCase())) return false;
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    return true;
  });

  const handleExport = () => {
    exportCSV('auditoria.csv',
      ['Data/Hora', 'Ação', 'Detalhes', 'Usuário', 'Tipo'],
      filtered.map(l => [new Date(l.timestamp).toLocaleString('pt-BR'), l.action, l.details, l.userName, l.type])
    );
    toast.success('CSV exportado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-display font-bold text-foreground">Auditoria</h2>
        <Button onClick={handleExport} variant="secondary" size="sm"><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input type="date" className="bg-secondary w-auto" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        <Input placeholder="Filtrar por funcionário" className="bg-secondary w-48" value={userFilter} onChange={e => setUserFilter(e.target.value)} />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-secondary w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="stock">Estoque</SelectItem>
            <SelectItem value="user">Usuários</SelectItem>
            <SelectItem value="permission">Permissões</SelectItem>
            <SelectItem value="product">Produtos</SelectItem>
            <SelectItem value="cash">Caixa</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 max-h-[70vh] overflow-y-auto">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm">Nenhum registro encontrado</p>}
        {filtered.map(l => (
          <div key={l.id} className="glass-card p-3 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-semibold text-foreground">{l.action}</span>
                <p className="text-muted-foreground text-xs mt-0.5">{l.details}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                <p>{new Date(l.timestamp).toLocaleString('pt-BR')}</p>
                <p>{l.userName}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-secondary text-xs">{l.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
