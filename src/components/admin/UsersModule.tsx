import { useEffect, useMemo, useState } from 'react';
import {
  addAuditLog,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_EMPLOYEE_PERMISSIONS,
  getUserProfiles,
  getUsers,
  initDefaultProfiles,
  setUserProfiles,
  setUsers,
  User,
  UserPermissions,
  UserProfile,
} from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Settings2, UserCircle2 } from 'lucide-react';

const EMPTY_PERMISSIONS: UserPermissions = { ...DEFAULT_EMPLOYEE_PERMISSIONS };

type ProfileForm = {
  id?: string;
  name: string;
  role: 'employee' | 'admin';
  permissions: UserPermissions;
};

const defaultProfileForm: ProfileForm = {
  name: '',
  role: 'employee',
  permissions: { ...EMPTY_PERMISSIONS },
};

export default function UsersModule() {
  const { user: currentUser } = useAuth();
  const [users, setLocalUsers] = useState<User[]>([]);
  const [profiles, setLocalProfiles] = useState<UserProfile[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(defaultProfileForm);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    password: '',
    position: '',
    baseSalary: '0',
    profileId: '',
  });

  const refresh = () => {
    setLocalUsers(getUsers());
    setLocalProfiles(getUserProfiles());
  };

  useEffect(() => {
    initDefaultProfiles();
    refresh();
  }, []);

  const profileMap = useMemo(
    () => new Map(profiles.map(p => [p.id, p])),
    [profiles],
  );

  const openCreate = () => {
    const defaultProfile = profiles.find(p => p.role === 'employee') || profiles[0];
    setCreateForm({
      name: '',
      code: '',
      password: '',
      position: '',
      baseSalary: '0',
      profileId: defaultProfile?.id || '',
    });
    setShowCreate(true);
  };

  const handleCreate = () => {
    const profile = profiles.find(p => p.id === createForm.profileId);
    if (!createForm.name.trim() || !createForm.code.trim() || !createForm.password || !profile) {
      toast.error('Preencha nome, codigo, senha e tipo de usuario');
      return;
    }
    const existing = getUsers();
    if (existing.some(u => u.code === createForm.code.trim())) {
      toast.error('Codigo de acesso ja existe');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: createForm.name.trim(),
      code: createForm.code.trim(),
      password: createForm.password,
      role: profile.role,
      profileId: profile.id,
      position: createForm.position.trim(),
      status: 'active',
      baseSalary: parseFloat(createForm.baseSalary) || 0,
      createdBy: currentUser?.id,
      createdAt: new Date().toISOString(),
      permissions: { ...profile.permissions },
    };

    existing.push(newUser);
    setUsers(existing);
    addAuditLog({
      action: 'Usuario criado',
      type: 'user',
      details: `${newUser.name} (${profile.name})`,
      userId: currentUser!.id,
      userName: currentUser!.name,
    });
    setShowCreate(false);
    refresh();
    toast.success('Usuario criado');
  };

  const toggleStatus = (userId: string) => {
    const all = getUsers();
    const target = all.find(u => u.id === userId);
    if (!target) return;
    target.status = target.status === 'active' ? 'inactive' : 'active';
    setUsers(all);
    addAuditLog({
      action: 'Status de usuario alterado',
      type: 'user',
      details: `${target.name}: ${target.status}`,
      userId: currentUser!.id,
      userName: currentUser!.name,
    });
    refresh();
  };

  const applyProfileToUser = (userId: string, profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    const all = getUsers();
    const target = all.find(u => u.id === userId);
    if (!target) return;
    target.profileId = profile.id;
    target.role = profile.role;
    target.permissions = { ...profile.permissions };
    setUsers(all);
    addAuditLog({
      action: 'Perfil atribuido ao usuario',
      type: 'permission',
      details: `${target.name} -> ${profile.name}`,
      userId: currentUser!.id,
      userName: currentUser!.name,
    });
    refresh();
    toast.success('Perfil aplicado');
  };

  const openNewProfile = () => {
    setProfileForm({
      name: '',
      role: 'employee',
      permissions: { ...DEFAULT_EMPLOYEE_PERMISSIONS },
    });
    setShowProfileEditor(true);
  };

  const openEditProfile = (profile: UserProfile) => {
    setProfileForm({
      id: profile.id,
      name: profile.name,
      role: profile.role,
      permissions: { ...profile.permissions },
    });
    setShowProfileEditor(true);
  };

  const saveProfile = () => {
    if (!profileForm.name.trim()) {
      toast.error('Informe nome do perfil');
      return;
    }

    const all = getUserProfiles();
    if (profileForm.id) {
      const target = all.find(p => p.id === profileForm.id);
      if (!target) return;
      target.name = profileForm.name.trim();
      target.role = profileForm.role;
      target.permissions = { ...profileForm.permissions };
    } else {
      all.push({
        id: crypto.randomUUID(),
        name: profileForm.name.trim(),
        role: profileForm.role,
        permissions: { ...profileForm.permissions },
        createdAt: new Date().toISOString(),
      });
    }
    setUserProfiles(all);
    addAuditLog({
      action: 'Perfil de usuario salvo',
      type: 'permission',
      details: profileForm.name.trim(),
      userId: currentUser!.id,
      userName: currentUser!.name,
    });
    setShowProfileEditor(false);
    refresh();
    toast.success('Perfil salvo');
  };

  const removeProfile = (id: string) => {
    const all = getUserProfiles();
    const target = all.find(p => p.id === id);
    if (!target || target.isSystem) {
      toast.error('Perfil padrao nao pode ser removido');
      return;
    }
    if (getUsers().some(u => u.profileId === id)) {
      toast.error('Perfil em uso por usuarios');
      return;
    }
    setUserProfiles(all.filter(p => p.id !== id));
    refresh();
    toast.success('Perfil removido');
  };

  const permissionKeys = Object.keys(DEFAULT_ADMIN_PERMISSIONS) as (keyof UserPermissions)[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-display font-bold text-foreground">Usuarios e RH</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowPermissions(true)}>
            <Settings2 className="w-4 h-4 mr-2" />
            Gerenciar permissoes
          </Button>
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo usuario
          </Button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="space-y-2">
          {users.map(u => {
            const profile = u.profileId ? profileMap.get(u.profileId) : null;
            return (
              <div key={u.id} className="rounded-md border border-border bg-secondary px-3 py-3">
                <div>
                  <p className="font-medium text-foreground">{u.name} <span className="text-xs text-muted-foreground">({u.code})</span></p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.name || (u.role === 'admin' ? 'Administrador' : 'Funcionario')} | {u.position || '-'} | {u.status === 'active' ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className="mt-2">
                  <Button size="sm" variant="ghost" onClick={() => toggleStatus(u.id)}>
                    {u.status === 'active' ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            );
          })}
          {users.length === 0 && <p className="text-sm text-muted-foreground px-2 py-4">Nenhum usuario cadastrado</p>}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Novo usuario</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" className="bg-secondary" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
            <Input placeholder="Codigo de acesso" className="bg-secondary" value={createForm.code} onChange={e => setCreateForm({ ...createForm, code: e.target.value })} />
            <Input type="password" placeholder="Senha" className="bg-secondary" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
            <Input placeholder="Cargo" className="bg-secondary" value={createForm.position} onChange={e => setCreateForm({ ...createForm, position: e.target.value })} />
            <Input type="number" placeholder="Salario base" className="bg-secondary" value={createForm.baseSalary} onChange={e => setCreateForm({ ...createForm, baseSalary: e.target.value })} />
            <Select value={createForm.profileId} onValueChange={v => setCreateForm({ ...createForm, profileId: v })}>
              <SelectTrigger className="bg-secondary"><SelectValue placeholder="Tipo de usuario / perfil" /></SelectTrigger>
              <SelectContent>
                {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.role === 'admin' ? 'Admin' : 'Funcionario'})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} className="gradient-primary text-primary-foreground">Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Gerenciar permissoes e perfis</DialogTitle></DialogHeader>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Perfis de usuario</h3>
              <Button size="sm" onClick={openNewProfile}><Plus className="w-4 h-4 mr-2" />Novo perfil</Button>
            </div>
            <div className="space-y-2">
              {profiles.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-secondary rounded p-3">
                  <div>
                    <p className="text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.role === 'admin' ? 'Administrador' : 'Funcionario'}{p.isSystem ? ' | Padrao' : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditProfile(p)}>Editar</Button>
                    {!p.isSystem && <Button size="sm" variant="ghost" onClick={() => removeProfile(p.id)}>Remover</Button>}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Atribuir perfil aos usuarios</h3>
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="grid grid-cols-[1.2fr,1fr] gap-3 items-center bg-secondary rounded p-3">
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{u.name} ({u.code})</span>
                    </div>
                    <Select value={u.profileId || ''} onValueChange={v => applyProfileToUser(u.id, v)}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="Selecionar perfil" /></SelectTrigger>
                      <SelectContent>
                        {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileEditor} onOpenChange={setShowProfileEditor}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{profileForm.id ? 'Editar perfil' : 'Novo perfil'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome do perfil"
              className="bg-secondary"
              value={profileForm.name}
              onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
            />
            <Select
              value={profileForm.role}
              onValueChange={(v: 'employee' | 'admin') =>
                setProfileForm({
                  ...profileForm,
                  role: v,
                  permissions: v === 'admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_EMPLOYEE_PERMISSIONS },
                })
              }
            >
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Funcionario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              {permissionKeys.map(key => (
                <label key={key} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary rounded px-2 py-1.5">
                  <Switch
                    checked={profileForm.permissions[key]}
                    onCheckedChange={checked =>
                      setProfileForm({
                        ...profileForm,
                        permissions: { ...profileForm.permissions, [key]: !!checked },
                      })
                    }
                  />
                  {key}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowProfileEditor(false)}>Cancelar</Button>
            <Button onClick={saveProfile} className="gradient-primary text-primary-foreground">Salvar perfil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
