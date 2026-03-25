import { useState } from 'react';
import { getUsers, setUsers, User, UserPermissions, DEFAULT_EMPLOYEE_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS, addAuditLog, getVouchers, setVouchers, getPayrollItems, setPayrollItems, Voucher, PayrollItem } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { exportCSV } from '@/lib/export-utils';
import { Plus, Edit2, Download, User as UserIcon, Shield } from 'lucide-react';

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  stock: 'Estoque', audit: 'Auditoria', hr: 'RH e Folha', cashRegister: 'Caixa',
  licenses: 'Licenças', documents: 'Documentos', notes: 'Anotações', calendar: 'Agenda',
  phonebook: 'Agenda Telefônica', approveProducts: 'Aprovar Produtos', exportData: 'Exportar Dados',
  manageUsers: 'Gerenciar Usuários',
};

export default function UsersModule() {
  const { user: currentUser } = useAuth();
  const [users, setLocalUsers] = useState(getUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showPayroll, setShowPayroll] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', code: '', password: '', position: '', role: 'employee' as 'employee' | 'admin', baseSalary: '0' });
  // Voucher/payroll forms
  const [voucherForm, setVoucherForm] = useState({ type: '', value: '', description: '' });
  const [payrollForm, setPayrollForm] = useState({ description: '', value: '', type: 'credit' as 'credit' | 'debit' });

  const refresh = () => setLocalUsers(getUsers());

  const handleCreate = () => {
    if (!form.name || !form.code || !form.password) { toast.error('Preencha todos os campos obrigatórios'); return; }
    const existing = getUsers();
    if (existing.some(u => u.code === form.code)) { toast.error('Código já existe'); return; }
    const newUser: User = {
      id: crypto.randomUUID(), name: form.name, code: form.code, password: form.password,
      role: form.role, position: form.position, status: 'active', baseSalary: parseFloat(form.baseSalary) || 0,
      createdBy: currentUser!.id, createdAt: new Date().toISOString(),
      permissions: form.role === 'admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_EMPLOYEE_PERMISSIONS },
    };
    existing.push(newUser);
    setUsers(existing);
    addAuditLog({ action: 'Usuário criado', type: 'user', details: `${form.name} (${form.role})`, userId: currentUser!.id, userName: currentUser!.name });
    toast.success('Usuário criado!');
    setShowCreate(false);
    setForm({ name: '', code: '', password: '', position: '', role: 'employee', baseSalary: '0' });
    refresh();
  };

  const togglePermission = (userId: string, perm: keyof UserPermissions) => {
    if (userId === currentUser!.id && perm === 'manageUsers') { toast.error('Você não pode remover sua própria permissão de gerenciar usuários'); return; }
    const all = getUsers();
    const u = all.find(x => x.id === userId)!;
    u.permissions[perm] = !u.permissions[perm];
    setUsers(all);
    addAuditLog({ action: 'Permissão alterada', type: 'permission', details: `${u.name}: ${PERMISSION_LABELS[perm]} → ${u.permissions[perm] ? 'ON' : 'OFF'}`, userId: currentUser!.id, userName: currentUser!.name });
    refresh();
    toast.success('Permissão atualizada');
  };

  const toggleStatus = (userId: string) => {
    const all = getUsers();
    const u = all.find(x => x.id === userId)!;
    u.status = u.status === 'active' ? 'inactive' : 'active';
    setUsers(all);
    addAuditLog({ action: `Usuário ${u.status}`, type: 'user', details: u.name, userId: currentUser!.id, userName: currentUser!.name });
    refresh();
    toast.success(`Usuário ${u.status === 'active' ? 'ativado' : 'desativado'}`);
  };

  const addVoucher = () => {
    if (!showPayroll || !voucherForm.type || !voucherForm.value) return;
    const vouchers = getVouchers(showPayroll.id);
    vouchers.push({ id: crypto.randomUUID(), type: voucherForm.type, value: parseFloat(voucherForm.value), date: new Date().toISOString(), description: voucherForm.description });
    setVouchers(showPayroll.id, vouchers);
    setVoucherForm({ type: '', value: '', description: '' });
    toast.success('Vale adicionado');
  };

  const addPayrollItem = () => {
    if (!showPayroll || !payrollForm.description || !payrollForm.value) return;
    const items = getPayrollItems(showPayroll.id);
    items.push({ id: crypto.randomUUID(), description: payrollForm.description, value: parseFloat(payrollForm.value), type: payrollForm.type, date: new Date().toISOString() });
    setPayrollItems(showPayroll.id, items);
    setPayrollForm({ description: '', value: '', type: 'credit' });
    toast.success('Item adicionado');
  };

  const exportPayroll = () => {
    const rows = users.filter(u => u.status === 'active').map(u => {
      const vouchers = getVouchers(u.id);
      const items = getPayrollItems(u.id);
      const totalVouchers = vouchers.reduce((s, v) => s + v.value, 0);
      const credits = items.filter(i => i.type === 'credit').reduce((s, i) => s + i.value, 0);
      const debits = items.filter(i => i.type === 'debit').reduce((s, i) => s + i.value, 0);
      const net = u.baseSalary + credits - debits - totalVouchers;
      return [u.name, u.position, String(u.baseSalary), String(totalVouchers), String(credits), String(debits), String(net)];
    });
    exportCSV('folha_pagamento.csv', ['Nome', 'Cargo', 'Salário Base', 'Vales', 'Adicionais', 'Descontos', 'Líquido'], rows);
    toast.success('Folha exportada!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-display font-bold text-foreground">Usuários, RH & Permissões</h2>
        <div className="flex gap-2">
          <Button onClick={exportPayroll} variant="secondary" size="sm"><Download className="w-4 h-4 mr-2" />Folha de Pagamento</Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Novo Usuário</Button>
        </div>
      </div>

      <div className="space-y-4">
        {users.map(u => (
          <div key={u.id} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {u.role === 'admin' ? <Shield className="w-5 h-5 text-primary" /> : <UserIcon className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <p className="font-semibold text-foreground">{u.name} <span className="text-xs text-muted-foreground">({u.code})</span></p>
                  <p className="text-xs text-muted-foreground">{u.position} · {u.role === 'admin' ? 'Admin' : 'Funcionário'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${u.status === 'active' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                  {u.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
                <Button size="sm" variant="ghost" onClick={() => toggleStatus(u.id)}>
                  {u.status === 'active' ? 'Desativar' : 'Ativar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowPayroll(u)}>RH</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {(Object.keys(PERMISSION_LABELS) as (keyof UserPermissions)[]).map(perm => (
                <label key={perm} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={u.permissions[perm]} onCheckedChange={() => togglePermission(u.id, perm)} className="scale-75" />
                  {PERMISSION_LABELS[perm]}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create user dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Novo Usuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" className="bg-secondary" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Código/Login" className="bg-secondary" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            <Input type="password" placeholder="Senha" className="bg-secondary" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <Input placeholder="Cargo" className="bg-secondary" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
            <Input type="number" placeholder="Salário base" className="bg-secondary" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: e.target.value })} />
            <Select value={form.role} onValueChange={(v: 'employee' | 'admin') => setForm({ ...form, role: v })}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Funcionário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} className="gradient-primary text-primary-foreground">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll/HR dialog */}
      <Dialog open={!!showPayroll} onOpenChange={() => setShowPayroll(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">RH — {showPayroll?.name}</DialogTitle></DialogHeader>
          {showPayroll && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Salário Base: <span className="text-foreground font-semibold">R$ {showPayroll.baseSalary.toFixed(2)}</span></p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Vales</h4>
                {getVouchers(showPayroll.id).map(v => (
                  <div key={v.id} className="flex justify-between text-xs text-muted-foreground bg-secondary rounded p-2 mb-1">
                    <span>{v.type}: {v.description}</span><span>R$ {v.value.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Tipo" className="bg-secondary text-xs" value={voucherForm.type} onChange={e => setVoucherForm({ ...voucherForm, type: e.target.value })} />
                  <Input type="number" placeholder="Valor" className="bg-secondary text-xs w-24" value={voucherForm.value} onChange={e => setVoucherForm({ ...voucherForm, value: e.target.value })} />
                  <Button size="sm" onClick={addVoucher}><Plus className="w-3 h-3" /></Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Itens de Pagamento</h4>
                {getPayrollItems(showPayroll.id).map(i => (
                  <div key={i.id} className="flex justify-between text-xs text-muted-foreground bg-secondary rounded p-2 mb-1">
                    <span>{i.description} ({i.type === 'credit' ? '+' : '-'})</span><span>R$ {i.value.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Descrição" className="bg-secondary text-xs flex-1" value={payrollForm.description} onChange={e => setPayrollForm({ ...payrollForm, description: e.target.value })} />
                  <Input type="number" placeholder="Valor" className="bg-secondary text-xs w-24" value={payrollForm.value} onChange={e => setPayrollForm({ ...payrollForm, value: e.target.value })} />
                  <Select value={payrollForm.type} onValueChange={(v: 'credit' | 'debit') => setPayrollForm({ ...payrollForm, type: v })}>
                    <SelectTrigger className="bg-secondary w-24 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="credit">Crédito</SelectItem><SelectItem value="debit">Débito</SelectItem></SelectContent>
                  </Select>
                  <Button size="sm" onClick={addPayrollItem}><Plus className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
