import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Flame, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !password) { toast.error('Preencha todos os campos'); return; }
    if (login(code, password)) {
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('Credenciais inválidas ou usuário inativo');
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-4">
            <Flame className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient">Churrascaria</h1>
          <p className="text-muted-foreground mt-1">Sistema de Gestão</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Código de acesso" value={code} onChange={e => setCode(e.target.value)} className="pl-10 bg-secondary border-border" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 bg-secondary border-border" />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold">Entrar</Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-6">Admin padrão: admin / admin123</p>
      </div>
    </div>
  );
}
