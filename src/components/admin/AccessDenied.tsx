import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AccessDeniedProps {
  message?: string;
  requiredRole?: string;
}

export default function AccessDenied({ 
  message = "You don't have permission to access this page.",
  requiredRole
}: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Shield className="w-12 h-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
      <p className="text-muted-foreground text-center max-w-md mb-4">{message}</p>
      {requiredRole && (
        <p className="text-sm text-muted-foreground mb-6">
          Required role: <span className="font-medium">{requiredRole}</span>
        </p>
      )}
      <Button variant="outline" onClick={() => navigate('/admin')}>
        Return to Dashboard
      </Button>
    </div>
  );
}
