import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { addAuditLog, getActiveEmployeeByCode, type Product, type StockItem } from '@/lib/store';
import { api } from '@/lib/api';
import { ArrowLeft, Minus, Plus, Snowflake, UserCheck } from 'lucide-react';

type Operation = 'restock' | 'withdraw';

export default function EmployeePanel() {
  const [operation, setOperation] = useState<Operation>('withdraw');
  const [employeeCode, setEmployeeCode] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [history, setHistory] = useState<Array<{ id: string; type: 'entry' | 'exit'; productCode: string; productName: string; quantity: number; actorName: string; actorCode?: string; timestamp: string }>>([]);

  const normalizedProductQuery = productQuery.trim().toUpperCase();

  const loadData = async () => {
    try {
      const [approvedProducts, stock, stockHistory] = await Promise.all([
        api.listApprovedProducts(),
        api.listStock(),
        api.listStockHistory(),
      ]);
      setProducts(approvedProducts);
      setStockItems(stock);
      setHistory(stockHistory.slice(0, 20));
    } catch {
      toast.error('Falha ao conectar com a API de estoque');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedProduct = products.find(p => p.code === selectedProductCode) || null;
  const matchingProducts = useMemo(() => {
    if (!normalizedProductQuery) return products.slice(0, 6);
    return products
      .filter(
        p =>
          p.code.toUpperCase().includes(normalizedProductQuery) ||
          p.name.toUpperCase().includes(normalizedProductQuery),
      )
      .slice(0, 6);
  }, [products, normalizedProductQuery]);

  const updateQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee = getActiveEmployeeByCode(employeeCode);
    if (!employee) {
      toast.error('Codigo do funcionario invalido ou inativo');
      return;
    }
    if (!normalizedProductQuery && !selectedProduct) {
      toast.error('Informe codigo ou nome do produto');
      return;
    }

    const product =
      selectedProduct ||
      products.find(
        p =>
          p.code.toUpperCase() === normalizedProductQuery ||
          p.name.toUpperCase() === normalizedProductQuery,
      ) ||
      null;

    if (!product) {
      toast.error('Produto nao encontrado. Solicite cadastro/aprovacao no admin');
      return;
    }

    try {
      if (operation === 'restock') {
        await api.addStock(product.code, quantity, {
          actorName: employee.name,
          actorCode: employee.code,
          source: 'employee',
        });
        addAuditLog({
          action: 'Reposicao de produto',
          type: 'stock',
          details: `API estoque: ${product.code} - ${product.name} (+${quantity})`,
          userId: employee.id,
          userName: employee.name,
        });
        toast.success('Reposicao registrada com sucesso');
      } else {
        await api.removeStock(product.code, quantity, {
          actorName: employee.name,
          actorCode: employee.code,
          source: 'employee',
        });
        addAuditLog({
          action: 'Retirada de produto',
          type: 'stock',
          details: `API estoque: ${product.code} - ${product.name} (-${quantity})`,
          userId: employee.id,
          userName: employee.name,
        });
        toast.success(
          `Produto retirado com sucesso - Funcionario: ${employee.name} | Produto: ${product.name} (${product.code}) | Quantidade: ${quantity}`,
        );
      }
    } catch {
      toast.error(operation === 'restock' ? 'Falha ao registrar reposicao na API' : 'Falha ao registrar retirada na API');
      return;
    }

    setProductQuery('');
    setSelectedProductCode('');
    setQuantity(1);
    await loadData();
  };

  return (
    <div className="min-h-screen gradient-dark p-4 lg:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="glass-card p-4 lg:p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center">
              <Snowflake className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground">Area do Funcionario</h1>
              <p className="text-xs lg:text-sm text-muted-foreground">Movimente produtos cadastrados no admin (codigo ou nome)</p>
            </div>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Login Admin
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <form onSubmit={handleSubmit} className="glass-card p-5 lg:p-6 space-y-4 lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOperation('withdraw')}
                className={`rounded-md border p-3 text-sm transition-colors ${operation === 'withdraw' ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                Retirar Produto
              </button>
              <button
                type="button"
                onClick={() => setOperation('restock')}
                className={`rounded-md border p-3 text-sm transition-colors ${operation === 'restock' ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                Repor Produto
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Codigo do Funcionario</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                <Input
                  value={employeeCode}
                  onChange={e => setEmployeeCode(e.target.value)}
                  placeholder="Ex: funcionario"
                  className="pl-10 bg-secondary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Codigo ou nome do produto</label>
              <Input
                value={productQuery}
                onChange={e => {
                  setProductQuery(e.target.value);
                  setSelectedProductCode('');
                }}
                placeholder="Ex: CERVEJA-LATA ou Cerveja"
                className="bg-secondary"
              />
              <div className="rounded-md border border-border bg-secondary max-h-40 overflow-y-auto">
                {matchingProducts.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum produto encontrado</p>
                ) : (
                  matchingProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProductQuery(p.code);
                        setSelectedProductCode(p.code);
                      }}
                      className={`w-full text-left px-3 py-2 border-b border-border last:border-b-0 transition-colors ${selectedProductCode === p.code ? 'bg-primary/15' : 'hover:bg-muted'}`}
                    >
                      <p className="text-sm text-foreground">{p.code} - {p.name}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="icon" onClick={() => updateQuantity(-1)}>
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 bg-secondary text-center"
                />
                <Button type="button" variant="secondary" size="icon" onClick={() => updateQuantity(1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {[1, 2, 6, 12].map(value => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={quantity === value ? 'default' : 'secondary'}
                    className={quantity === value ? 'gradient-primary text-primary-foreground' : ''}
                    onClick={() => setQuantity(value)}
                  >
                    {value} un.
                  </Button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground font-semibold">
              {operation === 'withdraw' ? 'Confirmar Retirada' : 'Confirmar Reposicao'}
            </Button>
          </form>

          <div className="space-y-4">
            <div className="glass-card p-5 lg:p-6">
              <h2 className="font-display font-semibold text-foreground mb-3">Visao do Estoque</h2>
              {stockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem itens cadastrados.</p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {stockItems.map(item => (
                    <div key={item.productId} className="bg-secondary rounded-md p-3 flex items-center justify-between">
                      <span className="text-sm text-foreground">{item.productCode} - {item.productName}</span>
                      <span className="text-xs text-muted-foreground">{item.quantity} un.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-5 lg:p-6">
              <h2 className="font-display font-semibold text-foreground mb-3">Historico de Movimentacoes</h2>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem historico.</p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {history.map(h => (
                    <div key={h.id} className="bg-secondary rounded-md p-3">
                      <p className="text-sm text-foreground">
                        {h.type === 'entry' ? 'Adicionado' : 'Retirado'}: {h.productName} ({h.productCode}) - {h.quantity} un.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Por: {h.actorName}{h.actorCode ? ` (${h.actorCode})` : ''} | {new Date(h.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
