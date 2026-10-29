import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { 
  AppRole, 
  RolePermissions, 
  hasPermission as checkPermission, 
  canManageRole as checkCanManageRole,
  rolePermissions 
} from '@/lib/rolePermissions';

export function usePermissions() {
  const { userRole: actualRole } = useAdminAuth();
  
  // Try to get viewAsRole, but handle case where ViewAsProvider isn't present
  let viewAsRole: AppRole | null = null;
  let isViewingAs = false;
  let viewAsProfile: ReturnType<typeof useViewAs>['viewAsProfile'] = null;
  try {
    const viewAs = useViewAs();
    viewAsRole = viewAs.viewAsRole;
    isViewingAs = viewAs.isViewingAs;
    viewAsProfile = viewAs.viewAsProfile;
  } catch {
    // ViewAsProvider not available, use actual role
  }

  // Use simulated role if viewing as, otherwise use actual role
  const effectiveRole = isViewingAs && viewAsRole ? viewAsRole : actualRole;

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return checkPermission(effectiveRole, permission);
  };

  const canManageRole = (targetRole: AppRole): boolean => {
    return checkCanManageRole(effectiveRole, targetRole);
  };

  const isSuperAdmin = effectiveRole === 'super_admin';
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'super_admin';
  const isEditor = effectiveRole === 'editor';
  const isSalesRep = effectiveRole === 'sales_rep';
  const isDistributor = effectiveRole === 'distributor';

  // Content permissions
  const canManageContent = hasPermission('canManageBlogPosts');
  
  // User management permissions
  const canViewUsers = hasPermission('canViewUsers');
  const canCreateUsers = hasPermission('canCreateUsers');
  const canEditUsers = hasPermission('canEditUsers');
  const canDeleteUsers = hasPermission('canDeleteUsers');
  const canInviteUsers = hasPermission('canInviteUsers');

  // Settings permissions
  const canManageEmailTemplates = hasPermission('canManageEmailTemplates');
  const canViewActivityLogs = hasPermission('canViewActivityLogs');
  const canManageScheduledJobs = hasPermission('canManageScheduledJobs');

  // Leads & registrations permissions
  const canViewLeads = hasPermission('canViewLeads');
  const canExportLeads = hasPermission('canExportLeads');
  const canViewRegistrations = hasPermission('canViewRegistrations');

  // Distributor (personal-scope CRM only)
  const canManageOwnCrm = hasPermission('canManageOwnCrm');

  return {
    userRole: effectiveRole,
    actualRole,
    isViewingAs,
    viewAsProfile,
    isSuperAdmin,
    isAdmin,
    isEditor,
    isSalesRep,
    isDistributor,
    hasPermission,
    canManageRole,
    // Content
    canManageContent,
    // Users
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canInviteUsers,
    // Settings
    canManageEmailTemplates,
    canViewActivityLogs,
    canManageScheduledJobs,
    // Leads
    canViewLeads,
    canExportLeads,
    canViewRegistrations,
    // Distributor
    canManageOwnCrm,
  };
}
