import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  EmployeeDocument,
  EmployeeNote,
  EmployeePayrollMonth,
  getEmployeeDocuments,
  getEmployeeNotes,
  getEmployeePayrollMonths,
  setEmployeeDocuments,
  setEmployeeNotes,
  setEmployeePayrollMonths,
  User,
} from '@/lib/store';

type Props = {
  user: User;
  profileName?: string;
  onBack: () => void;
  onToggleStatus: () => void;
};

type PayrollForm = {
  monthKey: string;
  baseSalary: string;
  voucherQuantity: string;
  voucherAmount: string;
  paidCash: string;
  paidBank: string;
  bonuses: string;
  discounts: string;
  notes: string;
};

function monthKeyNow() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(monthKey: string) {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, Math.max(0, month - 1), 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function EmployeeRhDetail({ user, profileName, onBack, onToggleStatus }: Props) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employeeNotes, setEmployeeNotesState] = useState<EmployeeNote[]>([]);
  const [payrollMonths, setPayrollMonths] = useState<EmployeePayrollMonth[]>([]);

  const [docForm, setDocForm] = useState({ title: '', category: '', description: '', referenceUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [noteInput, setNoteInput] = useState('');
  const [payrollForm, setPayrollForm] = useState<PayrollForm>({
    monthKey: monthKeyNow(),
    baseSalary: String(user.baseSalary || 0),
    voucherQuantity: '0',
    voucherAmount: '0',
    paidCash: '0',
    paidBank: '0',
    bonuses: '0',
    discounts: '0',
    notes: '',
  });

  const refresh = () => {
    setDocuments(getEmployeeDocuments(user.id));
    setEmployeeNotesState(getEmployeeNotes(user.id));
    const months = getEmployeePayrollMonths(user.id).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    setPayrollMonths(months);
  };

  useEffect(() => {
    refresh();
  }, [user.id]);

  useEffect(() => {
    const month = monthKeyNow();
    const current = getEmployeePayrollMonths(user.id).find(item => item.monthKey === month);
    setPayrollForm({
      monthKey: month,
      baseSalary: String(current?.baseSalary ?? user.baseSalary ?? 0),
      voucherQuantity: String(current?.voucherQuantity ?? 0),
      voucherAmount: String(current?.voucherAmount ?? 0),
      paidCash: String(current?.paidCash ?? 0),
      paidBank: String(current?.paidBank ?? 0),
      bonuses: String(current?.bonuses ?? 0),
      discounts: String(current?.discounts ?? 0),
      notes: current?.notes ?? '',
    });
  }, [user.id, user.baseSalary]);

  const loadPayrollMonth = (monthKey: string) => {
    if (!monthKey) return;
    const current = payrollMonths.find(item => item.monthKey === monthKey);
    setPayrollForm({
      monthKey,
      baseSalary: String(current?.baseSalary ?? user.baseSalary ?? 0),
      voucherQuantity: String(current?.voucherQuantity ?? 0),
      voucherAmount: String(current?.voucherAmount ?? 0),
      paidCash: String(current?.paidCash ?? 0),
      paidBank: String(current?.paidBank ?? 0),
      bonuses: String(current?.bonuses ?? 0),
      discounts: String(current?.discounts ?? 0),
      notes: current?.notes ?? '',
    });
  };

  const addDocument = () => {
    if (!docForm.title.trim()) {
      toast.error('Informe o nome do documento');
      return;
    }
    if (!docForm.referenceUrl.trim() && !selectedFile) {
      toast.error('Informe um link de referencia ou selecione um arquivo');
      return;
    }

    const saveDocument = (fileDataUrl?: string) => {
      const updated = [
        {
          id: crypto.randomUUID(),
          title: docForm.title.trim(),
          category: docForm.category.trim() || 'Geral',
          description: docForm.description.trim(),
          referenceUrl: docForm.referenceUrl.trim() || undefined,
          fileName: selectedFile?.name,
          fileType: selectedFile?.type,
          fileSize: selectedFile?.size,
          fileDataUrl,
          createdAt: new Date().toISOString(),
        },
        ...documents,
      ];
      setDocuments(updated);
      setEmployeeDocuments(user.id, updated);
      setDocForm({ title: '', category: '', description: '', referenceUrl: '' });
      setSelectedFile(null);
      setFileInputKey((k) => k + 1);
      toast.success('Documento salvo');
    };

    if (!selectedFile) {
      saveDocument(undefined);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => saveDocument(typeof reader.result === 'string' ? reader.result : undefined);
    reader.onerror = () => toast.error('Falha ao ler arquivo');
    reader.readAsDataURL(selectedFile);
  };

  const removeDocument = (id: string) => {
    const updated = documents.filter(item => item.id !== id);
    setDocuments(updated);
    setEmployeeDocuments(user.id, updated);
  };

  const addEmployeeNote = () => {
    if (!noteInput.trim()) {
      toast.error('Digite uma anotacao');
      return;
    }
    const updated = [
      {
        id: crypto.randomUUID(),
        content: noteInput.trim(),
        createdAt: new Date().toISOString(),
      },
      ...employeeNotes,
    ];
    setEmployeeNotesState(updated);
    setEmployeeNotes(user.id, updated);
    setNoteInput('');
    toast.success('Anotacao registrada');
  };

  const removeEmployeeNote = (id: string) => {
    const updated = employeeNotes.filter(item => item.id !== id);
    setEmployeeNotesState(updated);
    setEmployeeNotes(user.id, updated);
  };

  const savePayrollMonth = () => {
    if (!payrollForm.monthKey) {
      toast.error('Informe o mes da folha');
      return;
    }
    const next: EmployeePayrollMonth = {
      id: payrollMonths.find(item => item.monthKey === payrollForm.monthKey)?.id || crypto.randomUUID(),
      monthKey: payrollForm.monthKey,
      baseSalary: toNumber(payrollForm.baseSalary),
      voucherQuantity: Math.max(0, Math.trunc(toNumber(payrollForm.voucherQuantity))),
      voucherAmount: toNumber(payrollForm.voucherAmount),
      paidCash: toNumber(payrollForm.paidCash),
      paidBank: toNumber(payrollForm.paidBank),
      bonuses: toNumber(payrollForm.bonuses),
      discounts: toNumber(payrollForm.discounts),
      notes: payrollForm.notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [next, ...payrollMonths.filter(item => item.monthKey !== next.monthKey)].sort((a, b) =>
      b.monthKey.localeCompare(a.monthKey),
    );
    setPayrollMonths(updated);
    setEmployeePayrollMonths(user.id, updated);
    toast.success('Folha mensal salva');
  };

  const removePayrollMonth = (monthKey: string) => {
    const updated = payrollMonths.filter(item => item.monthKey !== monthKey);
    setPayrollMonths(updated);
    setEmployeePayrollMonths(user.id, updated);
    loadPayrollMonth(monthKeyNow());
  };

  const totalToPay = useMemo(
    () => toNumber(payrollForm.baseSalary) + toNumber(payrollForm.bonuses) - toNumber(payrollForm.discounts) - toNumber(payrollForm.voucherAmount),
    [payrollForm],
  );
  const totalPaid = useMemo(() => toNumber(payrollForm.paidCash) + toNumber(payrollForm.paidBank), [payrollForm]);
  const balance = totalToPay - totalPaid;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para lista
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleStatus}>
          {user.status === 'active' ? 'Desativar' : 'Ativar'}
        </Button>
      </div>

      <div className="glass-card p-4">
        <p className="text-xl font-display font-semibold text-foreground">{user.name}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Codigo: {user.code} | Perfil: {profileName || (user.role === 'admin' ? 'Administrador' : 'Funcionario')} | Cargo: {user.position || '-'}
        </p>
        <p className="text-sm text-muted-foreground">Salario base: R$ {user.baseSalary.toFixed(2)} | Status: {user.status === 'active' ? 'Ativo' : 'Inativo'}</p>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="notes">Anotacoes</TabsTrigger>
          <TabsTrigger value="payroll">Folha de pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="glass-card p-4 space-y-3">
            <p className="font-medium text-foreground">Novo documento</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Nome do documento" className="bg-secondary" value={docForm.title} onChange={e => setDocForm({ ...docForm, title: e.target.value })} />
              <Input placeholder="Categoria" className="bg-secondary" value={docForm.category} onChange={e => setDocForm({ ...docForm, category: e.target.value })} />
            </div>
            <Input placeholder="Link de referencia (opcional)" className="bg-secondary" value={docForm.referenceUrl} onChange={e => setDocForm({ ...docForm, referenceUrl: e.target.value })} />
            <div className="space-y-1">
              <Input
                key={fileInputKey}
                type="file"
                className="bg-secondary"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Informe link, upload ou os dois.
              </p>
            </div>
            <Textarea placeholder="Descricao / observacoes" className="bg-secondary min-h-[90px]" value={docForm.description} onChange={e => setDocForm({ ...docForm, description: e.target.value })} />
            <Button size="sm" onClick={addDocument}><Plus className="w-4 h-4 mr-2" />Salvar documento</Button>
          </div>

          <div className="glass-card p-4">
            <p className="font-medium text-foreground mb-3">Documentos cadastrados</p>
            <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
              {documents.map(doc => (
                <div key={doc.id} className="rounded-md border border-border bg-secondary p-3">
                  <div className="flex justify-between gap-2 items-start">
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.category} | {new Date(doc.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeDocument(doc.id)}>Excluir</Button>
                  </div>
                  {doc.description && <p className="text-xs text-muted-foreground mt-2">{doc.description}</p>}
                  <div className="flex gap-3 mt-2">
                    {doc.referenceUrl && (
                      <a href={doc.referenceUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                        Abrir link de referencia
                      </a>
                    )}
                    {doc.fileDataUrl && (
                      <a
                        href={doc.fileDataUrl}
                        download={doc.fileName || 'documento'}
                        className="text-xs text-primary underline"
                      >
                        Baixar arquivo {doc.fileName ? `(${doc.fileName})` : ''}
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {documents.length === 0 && <p className="text-sm text-muted-foreground">Nenhum documento cadastrado.</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="glass-card p-4 space-y-3">
            <p className="font-medium text-foreground">Nova anotacao</p>
            <Textarea placeholder="Digite observacoes sobre este funcionario" className="bg-secondary min-h-[120px]" value={noteInput} onChange={e => setNoteInput(e.target.value)} />
            <Button size="sm" onClick={addEmployeeNote}><Plus className="w-4 h-4 mr-2" />Salvar anotacao</Button>
          </div>
          <div className="glass-card p-4">
            <p className="font-medium text-foreground mb-3">Historico de anotacoes</p>
            <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
              {employeeNotes.map(note => (
                <div key={note.id} className="rounded-md border border-border bg-secondary p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString('pt-BR')}</p>
                    <Button variant="ghost" size="sm" onClick={() => removeEmployeeNote(note.id)}>Excluir</Button>
                  </div>
                  <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {employeeNotes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma anotacao cadastrada.</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="glass-card p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Mes da folha (competencia)</p>
                <Input type="month" className="bg-secondary" value={payrollForm.monthKey} onChange={e => loadPayrollMonth(e.target.value)} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Salario base (R$ do contrato no mes)</p>
                <Input type="number" placeholder="Ex: 2200" className="bg-secondary" value={payrollForm.baseSalary} onChange={e => setPayrollForm({ ...payrollForm, baseSalary: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Quantidade de vales</p>
                <Input type="number" placeholder="Ex: 10" className="bg-secondary" value={payrollForm.voucherQuantity} onChange={e => setPayrollForm({ ...payrollForm, voucherQuantity: e.target.value })} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Valor total dos vales (R$)</p>
                <Input type="number" placeholder="Ex: 300" className="bg-secondary" value={payrollForm.voucherAmount} onChange={e => setPayrollForm({ ...payrollForm, voucherAmount: e.target.value })} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pago em dinheiro (R$ em especie)</p>
                <Input type="number" placeholder="Ex: 500" className="bg-secondary" value={payrollForm.paidCash} onChange={e => setPayrollForm({ ...payrollForm, paidCash: e.target.value })} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pago no banco (R$ transferencia/deposito)</p>
                <Input type="number" placeholder="Ex: 1500" className="bg-secondary" value={payrollForm.paidBank} onChange={e => setPayrollForm({ ...payrollForm, paidBank: e.target.value })} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Bonus (R$ adicionais)</p>
                <Input type="number" placeholder="Ex: 200" className="bg-secondary" value={payrollForm.bonuses} onChange={e => setPayrollForm({ ...payrollForm, bonuses: e.target.value })} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Outros descontos (R$ alem dos vales)</p>
                <Input type="number" placeholder="Ex: 80" className="bg-secondary" value={payrollForm.discounts} onChange={e => setPayrollForm({ ...payrollForm, discounts: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Observacoes da folha (detalhes do mes)</p>
              <Textarea placeholder="Ex: Plantao extra no fim de semana" className="bg-secondary min-h-[90px]" value={payrollForm.notes} onChange={e => setPayrollForm({ ...payrollForm, notes: e.target.value })} />
            </div>
            <div className="rounded-md border border-border bg-secondary p-3 text-sm">
              <p className="text-muted-foreground">Total a pagar: <span className="text-foreground font-medium">R$ {totalToPay.toFixed(2)}</span></p>
              <p className="text-muted-foreground">Total pago (dinheiro + banco): <span className="text-foreground font-medium">R$ {totalPaid.toFixed(2)}</span></p>
              <p className="text-muted-foreground">Saldo da folha: <span className="text-foreground font-medium">R$ {balance.toFixed(2)}</span></p>
            </div>
            <Button size="sm" onClick={savePayrollMonth}>Salvar folha mensal</Button>
          </div>

          <div className="glass-card p-4">
            <p className="font-medium text-foreground mb-3">Historico mensal</p>
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {payrollMonths.map(item => {
                const itemTotal = item.baseSalary + item.bonuses - item.discounts - item.voucherAmount;
                const itemPaid = item.paidCash + item.paidBank;
                return (
                  <div key={item.id} className="rounded-md border border-border bg-secondary p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{monthLabel(item.monthKey)}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => loadPayrollMonth(item.monthKey)}>Abrir</Button>
                        <Button size="sm" variant="ghost" onClick={() => removePayrollMonth(item.monthKey)}>Excluir</Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Vales: {item.voucherQuantity} | Dinheiro: R$ {item.paidCash.toFixed(2)} | Banco: R$ {item.paidBank.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total: R$ {itemTotal.toFixed(2)} | Pago: R$ {itemPaid.toFixed(2)} | Saldo: R$ {(itemTotal - itemPaid).toFixed(2)}</p>
                  </div>
                );
              })}
              {payrollMonths.length === 0 && <p className="text-sm text-muted-foreground">Nenhum mes registrado.</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
