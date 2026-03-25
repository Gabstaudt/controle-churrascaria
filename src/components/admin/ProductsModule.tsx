import { useState } from 'react';
import { getProducts, setProducts, getConfig, addAuditLog, Product } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, X, Edit2, Trash2, Plus } from 'lucide-react';

export default function ProductsModule() {
  const { user } = useAuth();
  const config = getConfig();
  const [products, setLocal] = useState(getProducts);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', description: '' });
  const [filter, setFilter] = useState('all');

  const refresh = () => setLocal(getProducts());

  const approve = (id: string) => {
    const all = getProducts();
    const p = all.find(x => x.id === id)!;
    p.status = 'approved';
    p.history.push({ action: 'Aprovado', by: user!.name, at: new Date().toISOString() });
    setProducts(all);
    addAuditLog({ action: 'Produto aprovado', type: 'product', details: p.name, userId: user!.id, userName: user!.name });
    refresh();
    toast.success('Produto aprovado!');
  };

  const reject = (id: string) => {
    const all = getProducts();
    const p = all.find(x => x.id === id)!;
    p.status = 'rejected';
    p.history.push({ action: 'Rejeitado', by: user!.name, at: new Date().toISOString() });
    setProducts(all);
    addAuditLog({ action: 'Produto rejeitado', type: 'product', details: p.name, userId: user!.id, userName: user!.name });
    refresh();
    toast.success('Produto rejeitado');
  };

  const remove = (id: string) => {
    const all = getProducts().filter(p => p.id !== id);
    setProducts(all);
    addAuditLog({ action: 'Produto excluído', type: 'product', details: id, userId: user!.id, userName: user!.name });
    refresh();
    toast.success('Produto excluído');
  };

  const create = () => {
    if (!form.name || !form.category) { toast.error('Preencha nome e categoria'); return; }
    const all = getProducts();
    all.push({
      id: crypto.randomUUID(), name: form.name, category: form.category, description: form.description,
      status: 'approved', createdBy: user!.name, createdAt: new Date().toISOString(),
      history: [{ action: 'Criado pelo admin', by: user!.name, at: new Date().toISOString() }],
    });
    setProducts(all);
    addAuditLog({ action: 'Produto criado', type: 'product', details: form.name, userId: user!.id, userName: user!.name });
    setShowCreate(false);
    setForm({ name: '', category: '', description: '' });
    refresh();
    toast.success('Produto criado!');
  };

  const filtered = products.filter(p => filter === 'all' || p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-display font-bold text-foreground">Gestão de Produtos</h2>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Novo</Button>
      </div>
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="bg-secondary w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pending">Pendentes</SelectItem>
          <SelectItem value="approved">Aprovados</SelectItem>
          <SelectItem value="rejected">Rejeitados</SelectItem>
        </SelectContent>
      </Select>
      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="glass-card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.category} · por {p.createdBy}</p>
              {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded ${p.status === 'approved' ? 'bg-success/20 text-success' : p.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>
                {p.status === 'approved' ? 'Aprovado' : p.status === 'pending' ? 'Pendente' : 'Rejeitado'}
              </span>
              {p.status === 'pending' && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => approve(p.id)}><Check className="w-4 h-4 text-success" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => reject(p.id)}><X className="w-4 h-4 text-destructive" /></Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground text-sm">Nenhum produto encontrado</p>}
      </div>
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Novo Produto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" className="bg-secondary" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>{config.productCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Descrição" className="bg-secondary" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={create} className="gradient-primary text-primary-foreground">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
