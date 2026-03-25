import { useState } from 'react';
import { ensureFreezers, getConfig, setFreezers, addAuditLog } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { exportCSV } from '@/lib/export-utils';
import { Download, Edit2, Save, X } from 'lucide-react';

export default function StockModule() {
  const { user } = useAuth();
  const config = getConfig();
  const [freezers, setLocalFreezers] = useState(() => ensureFreezers(config.freezerCount));
  const [editingItem, setEditingItem] = useState<{ freezerId: number; idx: number; qty: number } | null>(null);

  const refresh = () => setLocalFreezers(ensureFreezers(config.freezerCount));

  const saveEdit = () => {
    if (!editingItem) return;
    const updated = [...freezers];
    const f = updated.find(fr => fr.id === editingItem.freezerId)!;
    if (editingItem.qty < 0) { toast.error('Quantidade não pode ser negativa'); return; }
    const old = f.items[editingItem.idx].quantity;
    f.items[editingItem.idx].quantity = editingItem.qty;
    if (editingItem.qty === 0) f.items.splice(editingItem.idx, 1);
    setFreezers(updated);
    addAuditLog({
      action: 'Edição manual de estoque', type: 'stock',
      details: `Freezer ${editingItem.freezerId}: ${f.items[editingItem.idx]?.productName || 'item removido'} de ${old} para ${editingItem.qty}`,
      userId: user!.id, userName: user!.name, freezerId: editingItem.freezerId,
    });
    setEditingItem(null);
    refresh();
    toast.success('Estoque atualizado');
  };

  const handleExport = () => {
    const rows: string[][] = [];
    freezers.forEach(f => f.items.forEach(i => rows.push([String(f.id), i.productName, String(i.quantity)])));
    exportCSV('estoque.csv', ['Freezer', 'Produto', 'Quantidade'], rows);
    toast.success('CSV exportado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-foreground">Controle de Estoque</h2>
        <Button onClick={handleExport} variant="secondary" size="sm"><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
      </div>
      {freezers.map(f => (
        <div key={f.id} className="glass-card p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">Freezer {f.id}</h3>
          {f.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Vazio</p>
          ) : (
            <div className="space-y-2">
              {f.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-secondary rounded p-2">
                  <span className="text-sm text-foreground">{item.productName}</span>
                  {editingItem?.freezerId === f.id && editingItem?.idx === idx ? (
                    <div className="flex items-center gap-2">
                      <Input type="number" className="w-20 h-8 bg-muted text-sm" value={editingItem.qty}
                        onChange={e => setEditingItem({ ...editingItem, qty: parseInt(e.target.value) || 0 })} />
                      <Button size="sm" variant="ghost" onClick={saveEdit}><Save className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{item.quantity} un.</span>
                      <Button size="sm" variant="ghost" onClick={() => setEditingItem({ freezerId: f.id, idx, qty: item.quantity })}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
