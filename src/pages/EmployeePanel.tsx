import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  getFreezers, setFreezers, ensureFreezers, getConfig,
  getProducts, setProducts, addAuditLog, Product,
} from '@/lib/store';
import { LogOut, Plus, Minus, Package, Snowflake } from 'lucide-react';

export default function EmployeePanel() {
  const { user, logout } = useAuth();
  const config = getConfig();
  const [tab, setTab] = useState<'restock' | 'withdraw' | 'register'>('restock');
  const [freezerNum, setFreezerNum] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalItems, setModalItems] = useState<{ name: string; qty: number }[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  // Withdraw
  const [withdrawFreezer, setWithdrawFreezer] = useState('');
  const [selectedWithdrawProduct, setSelectedWithdrawProduct] = useState('');
  const [withdrawQty, setWithdrawQty] = useState('1');
  // Register product
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  const handleOpenRestock = () => {
    const num = parseInt(freezerNum);
    if (!num || num < 1 || num > config.freezerCount) {
      toast.error(`Freezer inválido (1-${config.freezerCount})`); return;
    }
    setShowModal(true);
    setModalItems([]);
  };

  const addItem = () => {
    if (!newItemName.trim()) { toast.error('Nome do produto obrigatório'); return; }
    const qty = parseInt(newItemQty) || 1;
    setModalItems(prev => [...prev, { name: newItemName.trim(), qty }]);
    setNewItemName(''); setNewItemQty('1');
  };

  const confirmRestock = () => {
    if (modalItems.length === 0) { toast.error('Adicione pelo menos um produto'); return; }
    const num = parseInt(freezerNum);
    const freezers = ensureFreezers(config.freezerCount);
    const f = freezers.find(fr => fr.id === num)!;
    for (const item of modalItems) {
      const existing = f.items.find(i => i.productName === item.name);
      if (existing) { existing.quantity += item.qty; }
      else { f.items.push({ productId: crypto.randomUUID(), productName: item.name, quantity: item.qty }); }
    }
    setFreezers(freezers);
    addAuditLog({
      action: 'Reposição de estoque', type: 'stock',
      details: `Freezer ${num}: ${modalItems.map(i => `${i.name} (${i.qty})`).join(', ')}`,
      userId: user!.id, userName: user!.name, freezerId: num,
    });
    toast.success('Reposição confirmada!');
    setShowModal(false);
    setFreezerNum('');
  };

  const handleWithdraw = () => {
    const num = parseInt(withdrawFreezer);
    if (!num || num < 1 || num > config.freezerCount) {
      toast.error(`Freezer inválido (1-${config.freezerCount})`); return;
    }
    const freezers = ensureFreezers(config.freezerCount);
    const f = freezers.find(fr => fr.id === num)!;
    const item = f.items.find(i => i.productName === selectedWithdrawProduct);
    if (!item) { toast.error('Selecione um produto'); return; }
    const qty = parseInt(withdrawQty) || 1;
    if (qty > item.quantity) { toast.error('Estoque insuficiente!'); return; }
    item.quantity -= qty;
    if (item.quantity === 0) f.items = f.items.filter(i => i.productName !== selectedWithdrawProduct);
    setFreezers(freezers);
    addAuditLog({
      action: 'Retirada de estoque', type: 'stock',
      details: `Freezer ${num}: ${selectedWithdrawProduct} (${qty})`,
      userId: user!.id, userName: user!.name, freezerId: num,
    });
    toast.success('Retirada confirmada!');
    setSelectedWithdrawProduct('');
    setWithdrawQty('1');
  };

  const handleRegisterProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodCategory) { toast.error('Preencha nome e categoria'); return; }
    const products = getProducts();
    const newProd: Product = {
      id: crypto.randomUUID(), name: prodName.trim(), category: prodCategory,
      description: prodDesc, status: 'pending', createdBy: user!.name,
      createdAt: new Date().toISOString(), history: [{ action: 'Cadastro (pendente)', by: user!.name, at: new Date().toISOString() }],
    };
    products.push(newProd);
    setProducts(products);
    addAuditLog({
      action: 'Produto cadastrado (pendente)', type: 'product',
      details: `${prodName} - ${prodCategory}`,
      userId: user!.id, userName: user!.name,
    });
    toast.success('Produto cadastrado! Aguardando aprovação do admin.');
    setProdName(''); setProdCategory(''); setProdDesc('');
  };

  const freezerItems = (() => {
    const num = parseInt(withdrawFreezer);
    if (!num) return [];
    const freezers = getFreezers();
    return freezers.find(f => f.id === num)?.items || [];
  })();

  return (
    <div className="min-h-screen gradient-dark">
      <header className="glass-card rounded-none p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Snowflake className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-display font-bold text-foreground">Painel do Funcionário</h1>
            <p className="text-xs text-muted-foreground">{user?.name} — Cód: {user?.code}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout}><LogOut className="w-4 h-4" /></Button>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="flex gap-2">
          {(['restock', 'withdraw', 'register'] as const).map(t => (
            <Button key={t} variant={tab === t ? 'default' : 'secondary'} size="sm"
              className={tab === t ? 'gradient-primary text-primary-foreground' : ''}
              onClick={() => setTab(t)}>
              {t === 'restock' ? <><Plus className="w-4 h-4 mr-1" />Repor</> :
               t === 'withdraw' ? <><Minus className="w-4 h-4 mr-1" />Retirar</> :
               <><Package className="w-4 h-4 mr-1" />Cadastrar</>}
            </Button>
          ))}
        </div>

        {tab === 'restock' && (
          <div className="glass-card p-6 animate-fade-in space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Repor Produtos</h2>
            <Input type="number" placeholder={`Nº do Freezer (1-${config.freezerCount})`}
              value={freezerNum} onChange={e => setFreezerNum(e.target.value)} className="bg-secondary" />
            <Button onClick={handleOpenRestock} className="gradient-primary text-primary-foreground w-full">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Produtos
            </Button>
          </div>
        )}

        {tab === 'withdraw' && (
          <div className="glass-card p-6 animate-fade-in space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Retirar Produtos</h2>
            <Input type="number" placeholder={`Nº do Freezer (1-${config.freezerCount})`}
              value={withdrawFreezer} onChange={e => { setWithdrawFreezer(e.target.value); setSelectedWithdrawProduct(''); }} className="bg-secondary" />
            {freezerItems.length > 0 && (
              <>
                <Select value={selectedWithdrawProduct} onValueChange={setSelectedWithdrawProduct}>
                  <SelectTrigger className="bg-secondary"><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                  <SelectContent>
                    {freezerItems.map(i => (
                      <SelectItem key={i.productName} value={i.productName}>
                        {i.productName} (disponível: {i.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min="1" placeholder="Quantidade" value={withdrawQty}
                  onChange={e => setWithdrawQty(e.target.value)} className="bg-secondary" />
                <Button onClick={handleWithdraw} className="gradient-primary text-primary-foreground w-full">
                  <Minus className="w-4 h-4 mr-2" /> Confirmar Retirada
                </Button>
              </>
            )}
            {parseInt(withdrawFreezer) > 0 && freezerItems.length === 0 && (
              <p className="text-muted-foreground text-sm text-center">Freezer vazio</p>
            )}
          </div>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegisterProduct} className="glass-card p-6 animate-fade-in space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Cadastrar Produto</h2>
            <Input placeholder="Nome do produto" value={prodName} onChange={e => setProdName(e.target.value)} className="bg-secondary" />
            <Select value={prodCategory} onValueChange={setProdCategory}>
              <SelectTrigger className="bg-secondary"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {config.productCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Descrição (opcional)" value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="bg-secondary" />
            <Button type="submit" className="gradient-primary text-primary-foreground w-full">Cadastrar (Pendente de Aprovação)</Button>
          </form>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Adicionar ao Freezer {freezerNum}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Nome do produto" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="bg-secondary flex-1" />
              <Input type="number" min="1" placeholder="Qtd" value={newItemQty} onChange={e => setNewItemQty(e.target.value)} className="bg-secondary w-20" />
              <Button onClick={addItem} size="sm" className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4" /></Button>
            </div>
            {modalItems.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {modalItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 rounded bg-secondary">
                    <span className="text-foreground">{item.name}</span>
                    <span className="text-muted-foreground">x{item.qty}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={confirmRestock} className="gradient-primary text-primary-foreground">Confirmar Reposição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
