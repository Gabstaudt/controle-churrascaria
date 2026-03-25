import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Shield, UserCheck, LogOut } from 'lucide-react';

export default function AccessSelector() {
  const { user, selectAccess, logout } = useAuth();

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-lg animate-slide-up text-center">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">Olá, {user?.name}</h2>
        <p className="text-muted-foreground mb-8">Selecione o tipo de acesso</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button onClick={() => selectAccess('employee')}
            className="glass-card p-6 hover:border-primary/50 transition-colors group cursor-pointer">
            <UserCheck className="w-10 h-10 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-display font-semibold text-foreground">Funcionário</h3>
            <p className="text-sm text-muted-foreground mt-1">Repor e retirar produtos</p>
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => selectAccess('admin')}
              className="glass-card p-6 hover:border-primary/50 transition-colors group cursor-pointer">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-display font-semibold text-foreground">Administrativo</h3>
              <p className="text-sm text-muted-foreground mt-1">Gestão completa</p>
            </button>
          )}
        </div>
        <Button variant="ghost" onClick={logout} className="text-muted-foreground">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </div>
    </div>
  );
}
