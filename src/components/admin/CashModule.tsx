import { useState } from 'react';
import { getCashClosings, setCashClosings, getConfig, addAuditLog, CashEntry, CashClosing } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { exportCSV } from '@/lib/export-utils';
import { Plus, Download, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CashModule() {
  const { user } = useAuth();
  const config = getConfig();
  const [closings, setLocal] = useState(getCashClosings);
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [entryForm, setEntryForm] = useState({ category: '', description: '', value: '', type: 'income' as 'income' | 'expense' });
  const [manualCount, setManualCount] = useState('');
  const [notes, setNotes] = useState('');
  const [viewClosing, setViewClosing] = useState<CashClosing | null>(null);

  const addEntry = () => {
    if (!entryForm.category || !entryForm.value) { toast.error('Preencha categoria e valor'); return; }
    setEntries(prev => [...prev, {
      id: crypto.randomUUID(), category: entryForm.category, description: entryForm.description,
      value: parseFloat(entryForm.value), type: entryForm.type, timestamp: new Date().toISOString(),
    }]);
    setEntryForm({ category: '', description: '', value: '', type: 'income' });
  };

  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.value, 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.value, 0);

  const closeDay = () => {
    if (entries.length === 0) { toast.error('Adicione pelo menos uma entrada'); return; }
    const closing: CashClosing = {
      id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0],
      entries, totalIncome, totalExpense, balance: totalIncome - totalExpense,
      manualCount: parseFloat(manualCount) || 0, notes,
      closedBy: user!.name, closedAt: new Date().toISOString(),
    };
    const all = getCashClosings();
    all.unshift(closing);
    setCashClosings(all);
    addAuditLog({ action: 'Fechamento de caixa', type: 'cash', details: `Saldo: R$ ${closing.balance.toFixed(2)}`, userId: user!.id, userName: user!.name });
    setEntries([]); setManualCount(''); setNotes('');
    setLocal(getCashClosings());
    toast.success('Caixa fechado!');
  };

  const exportClosing = (c: CashClosing) => {
    const rows = c.entries.map(e => [e.category, e.description, e.type === 'income' ? 'Entrada' : 'Saída', String(e.value), new Date(e.timestamp).toLocaleString('pt-BR')]);
    rows.push(['', '', '', '', '']);
    rows.push(['Total Entradas', '', '', String(c.totalIncome), '']);
    rows.push(['Total Saídas', '', '', String(c.totalExpense), '']);
    rows.push(['Saldo', '', '', String(c.balance), '']);
    rows.push(['Contagem Manual', '', '', String(c.manualCount), '']);
    exportCSV(`caixa_${c.date}.csv`, ['Categoria', 'Descrição', 'Tipo', 'Valor', 'Hora'], rows);
    toast.success('Exportado!');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Fechamento de Caixa</h2>

      <div className="glass-card p-4 space-y-4">
        <h3 className="font-display font-semibold text-foreground">Novo Lançamento</h3>
        <div className="flex flex-wrap gap-2">
          <Select value={entryForm.category} onValueChange={v => setEntryForm({ ...entryForm, category: v })}>
            <SelectTrigger className="bg-secondary w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>{config.cashCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Descrição" className="bg-secondary flex-1 min-w-[120px]" value={entryForm.description} onChange={e => setEntryForm({ ...entryForm, description: e.target.value })} />
          <Input type="number" placeholder="Valor" className="bg-secondary w-28" value={entryForm.value} onChange={e => setEntryForm({ ...entryForm, value: e.target.value })} />
          <Select value={entryForm.type} onValueChange={(v: 'income' | 'expense') => setEntryForm({ ...entryForm, type: v })}>
            <SelectTrigger className="bg-secondary w-28"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="income">Entrada</SelectItem><SelectItem value="expense">Saída</SelectItem></SelectContent>
          </Select>
          <Button onClick={addEntry} size="sm" className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4" /></Button>
        </div>

        {entries.length > 0 && (
          <div className="space-y-1">
            {entries.map(e => (
              <div key={e.id} className="flex justify-between text-sm bg-secondary rounded p-2">
                <span className="text-foreground">{e.category} — {e.description}</span>
                <span className={e.type === 'income' ? 'text-success' : 'text-destructive'}>
                  {e.type === 'income' ? '+' : '-'} R$ {e.value.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold text-foreground pt-2 border-t border-border">
              <span>Entradas: R$ {totalIncome.toFixed(2)}</span>
              <span>Saídas: R$ {totalExpense.toFixed(2)}</span>
              <span>Saldo: R$ {(totalIncome - totalExpense).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Input type="number" placeholder="Contagem manual (R$)" className="bg-secondary w-48" value={manualCount} onChange={e => setManualCount(e.target.value)} />
          <Input placeholder="Observações" className="bg-secondary flex-1" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <Button onClick={closeDay} className="gradient-primary text-primary-foreground w-full">Fechar Caixa</Button>
      </div>

      <h3 className="font-display font-semibold text-foreground">Fechamentos Anteriores</h3>
      <div className="space-y-2">
        {closings.map(c => (
          <div key={c.id} className="glass-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{new Date(c.date).toLocaleDateString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">Saldo: R$ {c.balance.toFixed(2)} · Por: {c.closedBy}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setViewClosing(c)}><Eye className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => exportClosing(c)}><Download className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {closings.length === 0 && <p className="text-muted-foreground text-sm">Nenhum fechamento registrado</p>}
      </div>

      <Dialog open={!!viewClosing} onOpenChange={() => setViewClosing(null)}>
        <DialogContent className="bg-card border-border max-h-[70vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Fechamento — {viewClosing?.date}</DialogTitle></DialogHeader>
          {viewClosing && (
            <div className="space-y-2">
              {viewClosing.entries.map(e => (
                <div key={e.id} className="flex justify-between text-sm bg-secondary rounded p-2">
                  <span className="text-foreground">{e.category} — {e.description}</span>
                  <span className={e.type === 'income' ? 'text-success' : 'text-destructive'}>R$ {e.value.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 text-sm text-foreground space-y-1">
                <p>Total Entradas: R$ {viewClosing.totalIncome.toFixed(2)}</p>
                <p>Total Saídas: R$ {viewClosing.totalExpense.toFixed(2)}</p>
                <p className="font-bold">Saldo: R$ {viewClosing.balance.toFixed(2)}</p>
                <p>Contagem Manual: R$ {viewClosing.manualCount.toFixed(2)}</p>
                {viewClosing.notes && <p className="text-muted-foreground">Obs: {viewClosing.notes}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
