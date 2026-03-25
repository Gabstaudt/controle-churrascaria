import { useState } from 'react';
import { getNotes, setNotes, Note } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Pin, PinOff, Edit2, Trash2, Search } from 'lucide-react';

export default function NotesModule() {
  const [notes, setLocal] = useState(getNotes);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: '', content: '', tags: '' });

  const refresh = () => setLocal(getNotes());

  const save = () => {
    if (!form.title) { toast.error('Título obrigatório'); return; }
    const all = getNotes();
    if (editing) {
      const n = all.find(x => x.id === editing.id)!;
      n.title = form.title; n.content = form.content;
      n.tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      n.updatedAt = new Date().toISOString();
    } else {
      all.push({
        id: crypto.randomUUID(), title: form.title, content: form.content,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        pinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }
    setNotes(all);
    setEditing(null);
    setForm({ title: '', content: '', tags: '' });
    refresh();
    toast.success('Salvo!');
  };

  const togglePin = (id: string) => {
    const all = getNotes();
    const n = all.find(x => x.id === id)!;
    n.pinned = !n.pinned;
    setNotes(all);
    refresh();
  };

  const remove = (id: string) => {
    setNotes(getNotes().filter(n => n.id !== id));
    refresh();
    toast.success('Anotação removida');
  };

  const edit = (n: Note) => {
    setForm({ title: n.title, content: n.content, tags: n.tags.join(', ') });
    setEditing(n);
  };

  const filtered = notes
    .filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">Anotações</h2>
        <Button onClick={() => { setEditing(null); setForm({ title: '', content: '', tags: '' }); }} size="sm" className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Nova</Button>
      </div>

      <div className="glass-card p-4 space-y-3">
        <Input placeholder="Título" className="bg-secondary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea placeholder="Conteúdo" className="w-full bg-secondary rounded-md border border-border p-3 text-sm text-foreground min-h-[100px] resize-y"
          value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        <Input placeholder="Tags (separar com vírgula)" className="bg-secondary" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
        <Button onClick={save} className="gradient-primary text-primary-foreground">{editing ? 'Atualizar' : 'Salvar'}</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por título ou tag" className="bg-secondary pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(n => (
          <div key={n.id} className={`glass-card p-4 ${n.pinned ? 'border-l-4 border-l-primary' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{n.title}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{n.content}</p>
                {n.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">{n.tags.map(t => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Atualizado: {new Date(n.updatedAt).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => togglePin(n.id)}>
                  {n.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => edit(n)}><Edit2 className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma anotação</p>}
      </div>
    </div>
  );
}
