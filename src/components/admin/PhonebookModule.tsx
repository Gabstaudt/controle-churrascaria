import { useState } from 'react';
import { getContacts, setContacts, Contact } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { exportCSV } from '@/lib/export-utils';
import { Plus, Edit2, Trash2, Download, Search } from 'lucide-react';

const CATEGORIES = [
  { value: 'supplier', label: 'Fornecedor' },
  { value: 'client', label: 'Cliente' },
  { value: 'partner', label: 'Parceiro' },
  { value: 'employee', label: 'Funcionário' },
  { value: 'other', label: 'Outro' },
];

export default function PhonebookModule() {
  const [contacts, setLocal] = useState(getContacts);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '', category: 'other' as Contact['category'], notes: '' });

  const refresh = () => setLocal(getContacts());

  const save = () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    const all = getContacts();
    if (editId) {
      const c = all.find(x => x.id === editId)!;
      Object.assign(c, { ...form, phones: form.phone.split(',').map(p => p.trim()) });
    } else {
      all.push({ id: crypto.randomUUID(), ...form, phones: form.phone.split(',').map(p => p.trim()) });
    }
    setContacts(all);
    setShowForm(false); setEditId(null);
    setForm({ name: '', company: '', phone: '', email: '', address: '', category: 'other', notes: '' });
    refresh();
    toast.success(editId ? 'Contato atualizado' : 'Contato adicionado');
  };

  const edit = (c: Contact) => {
    setForm({ name: c.name, company: c.company, phone: c.phones.join(', '), email: c.email, address: c.address, category: c.category, notes: c.notes });
    setEditId(c.id);
    setShowForm(true);
  };

  const remove = (id: string) => {
    setContacts(getContacts().filter(c => c.id !== id));
    refresh();
    toast.success('Contato removido');
  };

  const handleExport = () => {
    exportCSV('agenda_telefonica.csv',
      ['Nome', 'Empresa', 'Telefones', 'Email', 'Endereço', 'Categoria', 'Observações'],
      contacts.map(c => [c.name, c.company, c.phones.join('; '), c.email, c.address, c.category, c.notes])
    );
    toast.success('Exportado!');
  };

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phones.some(p => p.includes(q)) || c.category.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-display font-bold text-foreground">Agenda Telefônica</h2>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="secondary" size="sm"><Download className="w-4 h-4 mr-2" />Exportar</Button>
          <Button onClick={() => { setEditId(null); setForm({ name: '', company: '', phone: '', email: '', address: '', category: 'other', notes: '' }); setShowForm(true); }} size="sm" className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Novo</Button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, telefone ou categoria" className="bg-secondary pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="glass-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.company} · {c.phones.join(', ')}</p>
              <p className="text-xs text-muted-foreground">{c.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{CATEGORIES.find(x => x.value === c.category)?.label}</span>
              <Button size="sm" variant="ghost" onClick={() => edit(c)}><Edit2 className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground text-sm">Nenhum contato</p>}
      </div>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editId ? 'Editar' : 'Novo'} Contato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" className="bg-secondary" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Empresa/Cargo" className="bg-secondary" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Telefones (separar com vírgula)" className="bg-secondary" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Email" className="bg-secondary" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Endereço" className="bg-secondary" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            <Select value={form.category} onValueChange={(v: Contact['category']) => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Observações" className="bg-secondary" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={save} className="gradient-primary text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
