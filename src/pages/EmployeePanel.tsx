import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { addAuditLog, ensureFreezers, getActiveEmployeeByCode, getConfig, getFreezers, setFreezers } from '@/lib/store';
import { ArrowLeft, Minus, Plus, Snowflake, UserCheck } from 'lucide-react';

type Operation = 'restock' | 'withdraw';

export default function EmployeePanel() {
  const config = getConfig();
  const [operation, setOperation] = useState<Operation>('withdraw');
  const [employeeCode, setEmployeeCode] = useState('');
  const [freezerNum, setFreezerNum] = useState('1');
  const [beverageQuery, setBeverageQuery] = useState('');
  const [beverageName, setBeverageName] = useState('');
  const [quantity, setQuantity] = useState(1);

  const normalizedBeverageQuery = beverageQuery.trim().toUpperCase();

  const freezerItems = useMemo(() => {
    const number = parseInt(freezerNum);
    if (!number || number < 1 || number > config.freezerCount) return [];
    const freezers = getFreezers();
    return freezers.find(f => f.id === number)?.items ?? [];
  }, [freezerNum, config.freezerCount]);

  const updateQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const findBeverageMatch = (items: { productCode: string; productName: string }[]) => {
    const query = normalizedBeverageQuery;
    const exactMatches = items.filter(
      item => item.productCode.trim().toUpperCase() === query || item.productName.trim().toUpperCase() === query,
    );
    if (exactMatches.length > 0) return { item: exactMatches[0], ambiguous: false };

    const partialMatches = items.filter(
      item => item.productCode.trim().toUpperCase().includes(query) || item.productName.trim().toUpperCase().includes(query),
    );
    if (partialMatches.length === 1) return { item: partialMatches[0], ambiguous: false };
    if (partialMatches.length > 1) return { item: null, ambiguous: true };
    return { item: null, ambiguous: false };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = getActiveEmployeeByCode(employeeCode);
    if (!employee) {
      toast.error('Codigo do funcionario invalido ou inativo');
      return;
    }

    const number = parseInt(freezerNum);
    if (!number || number < 1 || number > config.freezerCount) {
      toast.error(`Freezer invalido (1-${config.freezerCount})`);
      return;
    }

    if (!normalizedBeverageQuery) {
      toast.error('Informe o codigo ou nome da bebida');
      return;
    }

    const freezers = ensureFreezers(config.freezerCount);
    const freezer = freezers.find(f => f.id === number)!;
    const { item: existingItem, ambiguous } = findBeverageMatch(freezer.items);
    if (ambiguous) {
      toast.error('Mais de uma bebida encontrada. Refine a busca com codigo ou nome completo');
      return;
    }

    if (operation === 'restock') {
      if (existingItem) {
        if (beverageName.trim()) {
          existingItem.productName = beverageName.trim();
        }
        existingItem.quantity += quantity;
      } else {
        const normalizedName = beverageName.trim();
        if (!normalizedName) {
          toast.error('Informe o nome da bebida para cadastrar novo item');
          return;
        }
        freezer.items.push({
          productId: crypto.randomUUID(),
          productCode: normalizedBeverageQuery,
          productName: normalizedName,
          quantity,
        });
      }
      addAuditLog({
        action: 'Reposicao de bebida',
        type: 'stock',
        details: `Freezer ${number}: busca ${normalizedBeverageQuery} (+${quantity})`,
        userId: employee.id,
        userName: employee.name,
        freezerId: number,
      });
      toast.success('Reposicao registrada com sucesso');
    } else {
      if (!existingItem) {
        toast.error('Bebida nao encontrada no freezer selecionado');
        return;
      }
      if (existingItem.quantity < quantity) {
        toast.error('Quantidade insuficiente no freezer');
        return;
      }
      const beverageLabel = existingItem.productName
        ? `${existingItem.productName} (${existingItem.productCode || normalizedBeverageQuery})`
        : (existingItem.productCode || normalizedBeverageQuery);
      existingItem.quantity -= quantity;
      if (existingItem.quantity === 0) {
        freezer.items = freezer.items.filter(item => item !== existingItem);
      }
      addAuditLog({
        action: 'Retirada de bebida',
        type: 'stock',
        details: `Freezer ${number}: busca ${normalizedBeverageQuery} (-${quantity})`,
        userId: employee.id,
        userName: employee.name,
        freezerId: number,
      });
      toast.success(
        `Bebida retirada com sucesso - Funcionario: ${employee.name} | Bebida: ${beverageLabel} | Quantidade: ${quantity}`,
      );
    }

    setFreezers(freezers);
    setBeverageQuery('');
    setBeverageName('');
    setQuantity(1);
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
              <p className="text-xs lg:text-sm text-muted-foreground">Informe seu codigo, a bebida e a quantidade para retirar ou repor</p>
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
                Retirar Bebida
              </button>
              <button
                type="button"
                onClick={() => setOperation('restock')}
                className={`rounded-md border p-3 text-sm transition-colors ${operation === 'restock' ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-secondary text-muted-foreground hover:text-foreground'}`}
              >
                Repor Bebida
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <label className="text-xs font-medium text-muted-foreground">Freezer</label>
                <Input
                  type="number"
                  min="1"
                  max={config.freezerCount}
                  value={freezerNum}
                  onChange={e => setFreezerNum(e.target.value)}
                  className="bg-secondary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Codigo ou nome da bebida</label>
              <Input
                value={beverageQuery}
                onChange={e => setBeverageQuery(e.target.value)}
                placeholder="Ex: COKE-350 ou Coca-Cola"
                className="bg-secondary"
              />
            </div>

            {operation === 'restock' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Nome da Bebida (novo item)</label>
                <Input
                  value={beverageName}
                  onChange={e => setBeverageName(e.target.value)}
                  placeholder="Ex: Coca-Cola 350ml"
                  className="bg-secondary"
                />
              </div>
            )}

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

          <div className="glass-card p-5 lg:p-6">
            <h2 className="font-display font-semibold text-foreground mb-3">Visao do Freezer {freezerNum}</h2>
            {freezerItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem itens cadastrados.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {freezerItems.map(item => (
                  <div key={item.productId} className="bg-secondary rounded-md p-3 flex items-center justify-between">
                    <span className="text-sm text-foreground">{item.productCode || item.productName} - {item.productName}</span>
                    <span className="text-xs text-muted-foreground">{item.quantity} un.</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
