import { AuthProvider, useAuth } from '@/lib/auth-context';
import LoginPage from '@/pages/LoginPage';
import AccessSelector from '@/pages/AccessSelector';
import EmployeePanel from '@/pages/EmployeePanel';
import AdminPanel from '@/pages/AdminPanel';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const { user, accessType } = useAuth();

  if (!user) return <LoginPage />;
  if (!accessType) return <AccessSelector />;
  if (accessType === 'employee') return <EmployeePanel />;
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
