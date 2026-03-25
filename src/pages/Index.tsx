import { AuthProvider, useAuth } from '@/lib/auth-context';
import LoginPage from '@/pages/LoginPage';
import AdminPanel from '@/pages/AdminPanel';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;
  return <AdminPanel />;
}

export default function Index() {
  return (
    <AuthProvider>
      <Toaster />
      <AppContent />
    </AuthProvider>
  );
}
