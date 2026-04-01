import { useEffect, useMemo, useState } from 'react';
import { getConfig, addAuditLog, Product } from '@/lib/store';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';

type ProductForm = {
  code: string;
  name: string;
  category: string;
  description: string;
  price: string;
};

const emptyForm: ProductForm = {
  code: '',
  name: '',
  category: '',
  description: '',
  price: '',
};

export default function ProductsModule() {
  const { user } = useAuth();
  const config = getConfig();
  const [products, setLocal] = useState<Product[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [filter, setFilter] = useState('all');

  const refresh = async () => {
    try {
      const all = await api.listProducts();
      setLocal(all);
    } catch {
      toast.error('Falha ao carregar produtos da API');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const parsePrice = (raw: string) => {
    const value = Number(raw.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) return null;
    return value;
  };

  const toCode = (value: string) => value
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const buildUniqueCode = (name: string, currentId?: string) => {
    const used = new Set(
      products
        .filter(p => !currentId || p.id !== currentId)
        .map(p => p.code),
    );
    const base = toCode(name) || 'PRODUTO';
    if (!used.has(base)) return base;
    let i = 2;
    while (used.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  };

  const validateForm = () => {
    if (!form.name.trim() || !form.category || !form.description.trim()) {
      toast.error('Preencha nome, categoria e descricao');
      return null;
    }
    const price = parsePrice(form.price);
    if (price === null) {
      toast.error('Informe um preco valido');
      return null;
    }
    const code = toCode(form.code || form.name);
    if (!code) {
      toast.error('Informe um codigo valido');
      return null;
    }
    const duplicated = products.find(
      p => p.code === code && (!editingId || p.id !== editingId),
    );
    if (duplicated) {
      toast.error('Codigo de produto ja existe');
      return null;
    }
    return {
      code,
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      price,
    };
  };

  const approve = async (id: string) => {
    try {
      const p = await api.updateProductStatus(id, 'approved');
      addAuditLog({ action: 'Produto aprovado', type: 'product', details: p.name, userId: user!.id, userName: user!.name });
      await refresh();
      toast.success('Produto aprovado!');
    } catch {
      toast.error('Falha ao aprovar produto');
    }
  };

  const reject = async (id: string) => {
    try {
      const p = await api.updateProductStatus(id, 'rejected');
      addAuditLog({ action: 'Produto rejeitado', type: 'product', details: p.name, userId: user!.id, userName: user!.name });
      await refresh();
      toast.success('Produto rejeitado');
    } catch {
      toast.error('Falha ao rejeitar produto');
    }
  };

  const remove = async (id: string) => {
    try {
      await api.deleteProduct(id);
      addAuditLog({ action: 'Produto excluido', type: 'product', details: id, userId: user!.id, userName: user!.name });
      await refresh();
      toast.success('Produto excluido');
    } catch {
      toast.error('Falha ao excluir produto');
    }
  };

  const create = async () => {
    const valid = validateForm();
    if (!valid) return;
    try {
      await api.createProduct({
        code: valid.code,
        name: valid.name,
        category: valid.category,
        description: valid.description,
        price: valid.price,
        status: 'approved',
        createdBy: user!.name,
      });
      addAuditLog({
        action: 'Produto criado',
        type: 'product',
        details: `${valid.code} - ${valid.name} (R$ ${valid.price.toFixed(2)})`,
        userId: user!.id,
        userName: user!.name,
      });
      setShowCreate(false);
      setForm(emptyForm);
      await refresh();
      toast.success('Produto criado!');
    } catch {
      toast.error('Falha ao criar produto na API');
    }
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      code: product.code || buildUniqueCode(product.name, product.id),
      name: product.name,
      category: product.category,
      description: product.description,
      price: String(product.price ?? 0),
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const valid = validateForm();
    if (!valid) return;
    try {
      const product = await api.updateProduct(editingId, {
        code: valid.code,
        name: valid.name,
        category: valid.category,
        description: valid.description,
        price: valid.price,
      });
      addAuditLog({
        action: 'Produto editado',
        type: 'product',
        details: `${product.code} - ${product.name} (R$ ${product.price.toFixed(2)})`,
        userId: user!.id,
        userName: user!.name,
      });
      setShowEdit(false);
      setEditingId(null);
      setForm(emptyForm);
      await refresh();
      toast.success('Produto atualizado');
    } catch {
      toast.error('Falha ao atualizar produto na API');
    }
  };

  const filtered = useMemo(
    () => products.filter(p => filter === 'all' || p.status === filter),
    [products, filter],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-display font-bold text-foreground">Gestao de Produtos</h2>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Novo
        </Button>
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
          <div key={p.id} className="glass-card p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.code} | {p.category} | R$ {p.price.toFixed(2)} | por {p.createdBy}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
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
              <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit2 className="w-4 h-4" /></Button>
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
            <Input placeholder="Codigo" className="bg-secondary" value={form.code} onChange={e => setForm({ ...form, code: toCode(e.target.value) })} />
            <Input placeholder="Nome" className="bg-secondary" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>{config.productCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Descricao" className="bg-secondary" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input type="number" min="0" step="0.01" placeholder="Preco" className="bg-secondary" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={create} className="gradient-primary text-primary-foreground">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Editar Produto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Codigo" className="bg-secondary" value={form.code} onChange={e => setForm({ ...form, code: toCode(e.target.value) })} />
            <Input placeholder="Nome" className="bg-secondary" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>{config.productCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Descricao" className="bg-secondary" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input type="number" min="0" step="0.01" placeholder="Preco" className="bg-secondary" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button onClick={saveEdit} className="gradient-primary text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
