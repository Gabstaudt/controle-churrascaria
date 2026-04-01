import { useState } from 'react';
import { getConfig, setConfig, addAuditLog } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, Plus, X, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function SettingsModule() {
  const { user } = useAuth();
  const [config, setLocalConfig] = useState(getConfig);
  const [newProdCat, setNewProdCat] = useState('');
  const [newCashCat, setNewCashCat] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');

  const save = () => {
    setConfig(config);
    addAuditLog({
      action: 'Configuracoes atualizadas',
      type: 'system',
      details: 'Categorias e alertas atualizados',
      userId: user!.id,
      userName: user!.name,
    });
    toast.success('Configuracoes salvas!');
  };

  const addProdCat = () => {
    if (!newProdCat.trim()) return;
    setLocalConfig({ ...config, productCategories: [...config.productCategories, newProdCat.trim()] });
    setNewProdCat('');
  };

  const removeProdCat = (cat: string) => {
    setLocalConfig({ ...config, productCategories: config.productCategories.filter(c => c !== cat) });
  };

  const addCashCat = () => {
    if (!newCashCat.trim()) return;
    setLocalConfig({ ...config, cashCategories: [...config.cashCategories, newCashCat.trim()] });
    setNewCashCat('');
  };

  const removeCashCat = (cat: string) => {
    setLocalConfig({ ...config, cashCategories: config.cashCategories.filter(c => c !== cat) });
  };

  const handleReset = () => {
    if (resetConfirm !== 'RESETAR') {
      toast.error('Digite RESETAR para confirmar');
      return;
    }
    localStorage.clear();
    addAuditLog({ action: 'Sistema resetado', type: 'system', details: 'Reset completo', userId: user!.id, userName: user!.name });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground">Configuracoes do Sistema</h2>

      <div className="glass-card p-4 space-y-4">
        <h3 className="font-display font-semibold text-foreground">Categorias de Produtos</h3>
        <div className="flex flex-wrap gap-2">
          {config.productCategories.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-sm text-foreground">
              {c} <button onClick={() => removeProdCat(c)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Nova categoria" className="bg-secondary" value={newProdCat} onChange={e => setNewProdCat(e.target.value)} />
          <Button size="sm" onClick={addProdCat}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="glass-card p-4 space-y-4">
        <h3 className="font-display font-semibold text-foreground">Categorias do Caixa</h3>
        <div className="flex flex-wrap gap-2">
          {config.cashCategories.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-sm text-foreground">
              {c} <button onClick={() => removeCashCat(c)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Nova categoria" className="bg-secondary" value={newCashCat} onChange={e => setNewCashCat(e.target.value)} />
          <Button size="sm" onClick={addCashCat}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="glass-card p-4 space-y-4">
        <h3 className="font-display font-semibold text-foreground">Alertas de Licencas</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Dias de antecedencia padrao:</label>
          <Input
            type="number"
            min="1"
            className="bg-secondary w-24"
            value={config.defaultAlertDays}
            onChange={e => setLocalConfig({ ...config, defaultAlertDays: parseInt(e.target.value) || 30 })}
          />
        </div>
      </div>

      <Button onClick={save} className="gradient-primary text-primary-foreground">
        <Save className="w-4 h-4 mr-2" />
        Salvar Configuracoes
      </Button>

      <div className="glass-card p-4 border-l-4 border-l-destructive space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h3 className="font-display font-semibold text-foreground">Zona de Perigo</h3>
        </div>
        <p className="text-sm text-muted-foreground">Resetar todo o sistema. Esta acao nao pode ser desfeita.</p>
        <Button variant="destructive" onClick={() => setShowReset(true)}>Resetar Sistema</Button>
      </div>

      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display text-destructive">Confirmar Reset</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Digite <strong className="text-foreground">RESETAR</strong> para confirmar a exclusao de todos os dados.</p>
          <Input className="bg-secondary" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowReset(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReset}>Confirmar Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
