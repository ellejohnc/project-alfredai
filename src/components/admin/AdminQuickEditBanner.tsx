import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface AdminQuickEditBannerProps {
  adminPath: string;
  label: string;
}

const AdminQuickEditBanner = ({ adminPath, label }: AdminQuickEditBannerProps) => {
  const { isAdmin } = useAdminAuth();

  if (!isAdmin) return null;

  return (
    <div className="container-wide py-2">
      <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-primary font-medium">Admin Mode</span>
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={adminPath}>
            <Pencil className="w-3 h-3 mr-1" />
            {label}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default AdminQuickEditBanner;
