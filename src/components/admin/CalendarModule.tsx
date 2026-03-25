import { useState } from 'react';
import { getCalendarEvents, setCalendarEvents, addAuditLog, CalendarEvent } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Check, Trash2 } from 'lucide-react';

export default function CalendarModule() {
  const { user } = useAuth();
  const [events, setLocal] = useState(getCalendarEvents);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', description: '', responsible: '', priority: 'medium' as CalendarEvent['priority'] });
  const [filterStatus, setFilterStatus] = useState('all');

  const refresh = () => setLocal(getCalendarEvents());

  const create = () => {
    if (!form.title || !form.date) { toast.error('Preencha título e data'); return; }
    const all = getCalendarEvents();
    all.push({
      id: crypto.randomUUID(), ...form, status: 'pending',
    });
    setCalendarEvents(all);
    addAuditLog({ action: 'Evento criado', type: 'other', details: form.title, userId: user!.id, userName: user!.name });
    setShowCreate(false);
    setForm({ title: '', date: '', time: '', description: '', responsible: '', priority: 'medium' });
    refresh();
    toast.success('Evento criado!');
  };

  const toggleDone = (id: string) => {
    const all = getCalendarEvents();
    const e = all.find(x => x.id === id)!;
    e.status = e.status === 'done' ? 'pending' : 'done';
    setCalendarEvents(all);
    refresh();
  };

  const remove = (id: string) => {
    setCalendarEvents(getCalendarEvents().filter(e => e.id !== id));
    refresh();
    toast.success('Evento removido');
  };

  const filtered = events.filter(e => filterStatus === 'all' || e.status === filterStatus)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Simple month calendar
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const eventsOnDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-display font-bold text-foreground">Agenda / Calendário</h2>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Novo Evento</Button>
      </div>

      {/* Month calendar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}>←</Button>
          <h3 className="font-display font-semibold text-foreground">
            {new Date(calYear, calMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}>→</Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-muted-foreground font-semibold py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {monthDays.map(day => {
            const dayEvents = eventsOnDay(day);
            const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
            return (
              <div key={day} className={`p-1 rounded text-foreground text-xs min-h-[32px] ${isToday ? 'bg-primary/20 font-bold' : 'hover:bg-secondary'}`}>
                {day}
                {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="bg-secondary w-40"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="pending">Pendentes</SelectItem><SelectItem value="done">Concluídos</SelectItem></SelectContent>
      </Select>

      <div className="space-y-2">
        {filtered.map(e => (
          <div key={e.id} className="glass-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => toggleDone(e.id)} className={`w-5 h-5 rounded border flex items-center justify-center ${e.status === 'done' ? 'bg-success border-success' : 'border-border'}`}>
                {e.status === 'done' && <Check className="w-3 h-3 text-success-foreground" />}
              </button>
              <div>
                <p className={`text-sm font-semibold ${e.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.date} {e.time} · {e.responsible}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded ${e.priority === 'high' ? 'bg-destructive/20 text-destructive' : e.priority === 'medium' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'}`}>
                {e.priority === 'high' ? 'Alta' : e.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Novo Evento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título" className="bg-secondary" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input type="date" className="bg-secondary" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input type="time" className="bg-secondary" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            <Input placeholder="Descrição" className="bg-secondary" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Responsável" className="bg-secondary" value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} />
            <Select value={form.priority} onValueChange={(v: CalendarEvent['priority']) => setForm({ ...form, priority: v })}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="high">Alta</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="low">Baixa</SelectItem></SelectContent>
            </Select>
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
