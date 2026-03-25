import { useState } from 'react';
import { getLicenses, setLicenses, addAuditLog, License } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function LicensesModule() {
  const { user } = useAuth();
  const [licenses, setLocal] = useState(getLicenses);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', protocol: '', issuer: '', issueDate: '', expiryDate: '', alertDays: '30', notes: '' });
  const [renewalNote, setRenewalNote] = useState('');
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const refresh = () => setLocal(getLicenses());

  const getStatus = (expiryDate: string): License['status'] => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
    return days < 0 ? 'expired' : 'valid';
  };

  const save = () => {
    if (!form.name || !form.expiryDate) { toast.error('Preencha nome e vencimento'); return; }
    const all = getLicenses();
    if (editId) {
      const l = all.find(x => x.id === editId)!;
      Object.assign(l, { ...form, alertDays: parseInt(form.alertDays) || 30, status: getStatus(form.expiryDate) });
    } else {
      all.push({
        id: crypto.randomUUID(), ...form, alertDays: parseInt(form.alertDays) || 30,
        status: getStatus(form.expiryDate), attachments: [], renewalHistory: [],
      });
    }
    setLicenses(all);
    addAuditLog({ action: editId ? 'Licença editada' : 'Licença criada', type: 'system', details: form.name, userId: user!.id, userName: user!.name });
    setShowForm(false); setEditId(null);
    setForm({ name: '', protocol: '', issuer: '', issueDate: '', expiryDate: '', alertDays: '30', notes: '' });
    refresh();
    toast.success('Salvo!');
  };

  const addRenewal = () => {
    if (!renewingId) return;
    const all = getLicenses();
    const l = all.find(x => x.id === renewingId)!;
    l.renewalHistory.push({ date: new Date().toISOString(), notes: renewalNote });
    l.status = 'renewing';
    setLicenses(all);
    setRenewingId(null); setRenewalNote('');
    refresh();
    toast.success('Renovação registrada');
  };

  const remove = (id: string) => {
    setLicenses(getLicenses().filter(l => l.id !== id));
    refresh();
    toast.success('Licença removida');
  };

  const edit = (l: License) => {
    setForm({ name: l.name, protocol: l.protocol, issuer: l.issuer, issueDate: l.issueDate, expiryDate: l.expiryDate, alertDays: String(l.alertDays), notes: l.notes });
    setEditId(l.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">Licenças e Documentos Legais</h2>
        <Button onClick={() => { setEditId(null); setForm({ name: '', protocol: '', issuer: '', issueDate: '', expiryDate: '', alertDays: '30', notes: '' }); setShowForm(true); }} size="sm" className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Nova</Button>
      </div>
      <div className="space-y-3">
        {licenses.map(l => {
          const days = Math.ceil((new Date(l.expiryDate).getTime() - Date.now()) / 86400000);
          const isExpired = days < 0;
          const isWarning = !isExpired && days <= l.alertDays;
          return (
            <div key={l.id} className={`glass-card p-4 ${isExpired ? 'border-l-4 border-l-destructive' : isWarning ? 'border-l-4 border-l-warning' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {(isExpired || isWarning) && <AlertTriangle className={`w-4 h-4 ${isExpired ? 'text-destructive' : 'text-warning'}`} />}
                    <p className="font-semibold text-foreground">{l.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Protocolo: {l.protocol} · Emissor: {l.issuer}</p>
                  <p className="text-xs text-muted-foreground">Vencimento: {new Date(l.expiryDate).toLocaleDateString('pt-BR')} ({isExpired ? 'VENCIDA' : `${days} dias restantes`})</p>
                  {l.renewalHistory.length > 0 && <p className="text-xs text-muted-foreground mt-1">Renovações: {l.renewalHistory.length}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setRenewingId(l.id)}><RefreshCw className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => edit(l)}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          );
        })}
        {licenses.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma licença cadastrada</p>}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">{editId ? 'Editar' : 'Nova'} Licença</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da licença" className="bg-secondary" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Nº/Protocolo" className="bg-secondary" value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value })} />
            <Input placeholder="Órgão emissor" className="bg-secondary" value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-muted-foreground">Emissão</label><Input type="date" className="bg-secondary" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Vencimento</label><Input type="date" className="bg-secondary" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} /></div>
            </div>
            <Input type="number" placeholder="Dias de alerta antecipado" className="bg-secondary" value={form.alertDays} onChange={e => setForm({ ...form, alertDays: e.target.value })} />
            <Input placeholder="Observações" className="bg-secondary" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={save} className="gradient-primary text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renewingId} onOpenChange={() => setRenewingId(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Registrar Renovação</DialogTitle></DialogHeader>
          <Input placeholder="Observações da renovação" className="bg-secondary" value={renewalNote} onChange={e => setRenewalNote(e.target.value)} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRenewingId(null)}>Cancelar</Button>
            <Button onClick={addRenewal} className="gradient-primary text-primary-foreground">Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
