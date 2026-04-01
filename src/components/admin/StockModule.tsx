import { useEffect, useMemo, useState } from 'react';
import type { Product, StockItem } from '@/lib/store';
import { addAuditLog } from '@/lib/store';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { exportCSV } from '@/lib/export-utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Edit2, Plus, Save, X } from 'lucide-react';

const PAGE_SIZE = 8;

export default function StockModule() {
  const { user } = useAuth();
  const [items, setLocalItems] = useState<StockItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [editingItem, setEditingItem] = useState<{ id: string; qty: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [page, setPage] = useState(1);

  const refresh = async () => {
    try {
      const [stock, products] = await Promise.all([api.listStock(), api.listProducts()]);
      setLocalItems(stock);
      setAllProducts(products);
    } catch {
      toast.error('Falha ao carregar dados da API de estoque');
    }
  };
  const normalizedSearch = search.trim().toUpperCase();
  const qtyValue = Math.max(1, parseInt(addQty) || 1);

  useEffect(() => {
    void refresh();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!normalizedSearch) return allProducts;
    return allProducts.filter(
      p =>
        p.code.toUpperCase().includes(normalizedSearch) ||
        p.name.toUpperCase().includes(normalizedSearch),
    );
  }, [allProducts, normalizedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedProduct = allProducts.find(p => p.code === selectedProductCode) || null;

  const closeModal = () => {
    setShowAddModal(false);
    setSearch('');
    setSelectedProductCode('');
    setAddQty('1');
    setPage(1);
  };

  const handleAddStock = async () => {
    if (!selectedProduct) {
      toast.error('Selecione um produto');
      return;
    }
    if (selectedProduct.status !== 'approved') {
      toast.error('Somente produtos aprovados podem entrar no estoque');
      return;
    }

    try {
      await api.addStock(selectedProduct.code, qtyValue, {
        actorName: user?.name || 'Admin',
        actorCode: user?.code,
        source: 'admin',
      });
    } catch {
      toast.error('Nao foi possivel adicionar estoque na API');
      return;
    }
    addAuditLog({
      action: 'Entrada de estoque (admin)',
      type: 'stock',
      details: `${selectedProduct.code} - ${selectedProduct.name} (+${qtyValue})`,
      userId: user!.id,
      userName: user!.name,
    });
    toast.success('Estoque adicionado');
    closeModal();
    void refresh();
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    if (editingItem.qty < 0) {
      toast.error('Quantidade nao pode ser negativa');
      return;
    }

    const updated = [...items];
    const idx = updated.findIndex(i => i.productId === editingItem.id);
    if (idx === -1) return;

    const old = updated[idx].quantity;
    try {
      await api.updateStockQuantity(updated[idx].productCode, editingItem.qty);
    } catch {
      toast.error('Nao foi possivel atualizar o estoque na API');
      return;
    }
    addAuditLog({
      action: 'Edicao manual de estoque',
      type: 'stock',
      details: `${updated[idx]?.productCode || 'item removido'} de ${old} para ${editingItem.qty}`,
      userId: user!.id,
      userName: user!.name,
    });

    setEditingItem(null);
    void refresh();
    toast.success('Estoque atualizado');
  };

  const handleExport = () => {
    const rows: string[][] = items.map(i => [i.productCode, i.productName, String(i.quantity)]);
    exportCSV('estoque.csv', ['Codigo do Produto', 'Nome do Produto', 'Quantidade'], rows);
    toast.success('CSV exportado!');
  };

  const totalUnits = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-2xl font-display font-bold text-foreground">Controle de Estoque (Unico)</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddModal(true)} className="gradient-primary text-primary-foreground" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar estoque
          </Button>
          <Button onClick={handleExport} variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Itens em Estoque</h3>
          <p className="text-xs text-muted-foreground">Total: {items.length} itens | {totalUnits} un.</p>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Estoque vazio</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.productId} className="flex items-center justify-between bg-secondary rounded p-2">
                <div>
                  <span className="text-sm text-foreground font-medium">{item.productCode}</span>
                  <p className="text-xs text-muted-foreground">{item.productName}</p>
                </div>
                {editingItem?.id === item.productId ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20 h-8 bg-muted text-sm"
                      value={editingItem.qty}
                      onChange={e => setEditingItem({ ...editingItem, qty: parseInt(e.target.value) || 0 })}
                    />
                    <Button size="sm" variant="ghost" onClick={saveEdit}><Save className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}><X className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.quantity} un.</span>
                    <Button size="sm" variant="ghost" onClick={() => setEditingItem({ id: item.productId, qty: item.quantity })}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar estoque</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por codigo ou nome do produto"
              className="bg-secondary"
            />

            <div className="rounded-md border border-border bg-background max-h-72 overflow-y-auto">
              {pagedProducts.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">Nenhum produto encontrado</p>
              ) : (
                <ul className="divide-y divide-border">
                  {pagedProducts.map(p => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedProductCode(p.code)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${selectedProductCode === p.code ? 'bg-primary/15 text-foreground' : 'hover:bg-muted text-foreground'}`}
                      >
                        {p.code} - {p.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p>Pagina {currentPage} de {totalPages}</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  Proxima
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-secondary px-3 py-2">
                <p className="text-xs text-muted-foreground">Produto selecionado</p>
                {selectedProduct ? (
                  <p className="text-sm text-foreground">{selectedProduct.code} - {selectedProduct.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum produto selecionado</p>
                )}
              </div>
              <Input
                type="number"
                min="1"
                value={addQty}
                onChange={e => setAddQty(e.target.value)}
                className="bg-secondary"
                placeholder="Quantidade"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleAddStock} className="gradient-primary text-primary-foreground">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
