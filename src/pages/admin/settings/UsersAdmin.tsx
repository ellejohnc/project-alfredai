import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useActivityLog } from '@/hooks/useActivityLog';
import { usePermissions } from '@/hooks/usePermissions';
import { roleLabels, type AppRole } from '@/lib/rolePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit, Users, Shield, ShieldCheck, Crown, Mail, Clock, Send, X, Eye, EyeOff, RefreshCw, KeyRound, DollarSign, Wand2, Handshake, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import AccessDenied from '@/components/admin/AccessDenied';
import { StatusBadge } from '@/components/admin/StatusBadge';
import DIYAccessRequestsTab from '@/pages/admin/settings/DIYAccessRequestsTab';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMetricsStrip } from '@/components/admin/AdminMetricsStrip';
import { AdminToolbar } from '@/components/admin/AdminToolbar';


interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: AppRole;
  created_at: string;
  last_login_at: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: AppRole;
  invited_by_email: string;
  expires_at: string;
  created_at: string;
}

type RequestStatus = 'pending' | 'approved' | 'rejected';

export default function UsersAdmin() {
  const { user, userRole: actualUserRole } = useAdminAuth();
  const { logActivity } = useActivityLog();
  const { canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers, canInviteUsers, isSuperAdmin, isAdmin: hasAdminRole, canManageRole, isViewingAs } = usePermissions();
  
  // View As controls - only in this component
  let viewAsControls = { viewAsRole: null as AppRole | null, setViewAsRole: (_: AppRole | null, __?: { userId: string; email?: string | null; displayName?: string | null } | null) => {}, clearViewAs: () => {} };
  try {
    const viewAs = useViewAs();
    viewAsControls = viewAs;
  } catch {
    // ViewAsProvider not available
  }
  const { viewAsRole, setViewAsRole, clearViewAs } = viewAsControls;
  
  // Check if current user can use View As (based on actual role, not simulated)
  const canUseViewAs = actualUserRole === 'super_admin' || actualUserRole === 'admin';
  const availableViewAsRoles: AppRole[] = actualUserRole === 'super_admin' 
    ? ['super_admin', 'admin', 'editor', 'sales_rep', 'distributor'] 
    : ['admin', 'editor', 'sales_rep', 'distributor'];
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Users tab filters. Status replaces the old "Show Inactive (30+ days)"
  // toggle; it is also what the tiles set.
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'never'>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortValue, setSortValue] = useState('name_asc');
  const [diyStatuses, setDiyStatuses] = useState<Record<string, RequestStatus>>({});
  
  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('editor');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(false);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('editor');
  
  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<AppRole>('editor');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Password reset state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Current user's display name
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState<string>('');

  useEffect(() => {
    fetchDisplayName();
    fetchUsers();
    fetchInvitations();

    // Set up real-time subscription for admin_users (last_login updates)
    const channel = supabase
      .channel('admin-users-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_users'
        },
        (payload) => {
          // Update the user in the local state
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === payload.new.id 
                ? { ...u, ...payload.new } as AdminUser
                : u
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchDisplayName = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('admin_users')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      setCurrentUserDisplayName(data.display_name);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);

    const [usersResult, rolesResult, diyResult] = await Promise.all([
      supabase.from('admin_users').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase.from('diy_access_requests').select('user_id, status')
    ]);

    if (usersResult.data) {
      setUsers(usersResult.data);
    }
    if (rolesResult.data) {
      setUserRoles(rolesResult.data as UserRole[]);
    }
    if (diyResult.data) {
      const statuses: Record<string, RequestStatus> = {};
      (diyResult.data as { user_id: string; status: RequestStatus }[]).forEach((row) => {
        statuses[row.user_id] = row.status;
      });
      setDiyStatuses(statuses);
    }

    setIsLoading(false);
  };

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from('pending_invitations')
      .select('id, email, role, invited_by, invited_by_email, expires_at, created_at')
      .order('created_at', { ascending: false });
    
    if (data) {
      setPendingInvitations(data as PendingInvitation[]);
    }
  };

  // Get role by checking both admin_users id and user_id in user_roles
  const getUserRole = (adminUserId: string): AppRole => {
    // First check user_roles by user_id
    const roleByUserId = userRoles.find(r => r.user_id === adminUserId);
    if (roleByUserId) return roleByUserId.role as AppRole;
    
    // Find admin user and check their stored role
    const adminUser = users.find(u => u.id === adminUserId);
    return (adminUser?.role as AppRole) || 'editor';
  };

  // Check if admin user matches current auth user by email
  const isCurrentUser = (adminUser: AdminUser): boolean => {
    return adminUser.email === user?.email;
  };

  const canDeleteUser = (adminUser: AdminUser): boolean => {
    if (isCurrentUser(adminUser)) return false; // Can't delete yourself
    if (!canDeleteUsers) return false;
    if (isSuperAdmin) return true; // Super admin can delete anyone
    
    const targetRole = getUserRole(adminUser.id);
    // Admins can only delete editors
    return hasAdminRole && targetRole === 'editor';
  };

  const canEditUserRole = (adminUser: AdminUser): boolean => {
    if (isCurrentUser(adminUser)) return false; // Can't edit your own role
    if (!canEditUsers) return false;
    if (isSuperAdmin) return true; // Super admin can edit anyone
    
    const targetRole = getUserRole(adminUser.id);
    // Admins can only change roles of editors
    return hasAdminRole && targetRole === 'editor';
  };

  // Check if user can edit display name - self or others (with permissions)
  const canEditUserDisplayName = (adminUser: AdminUser): boolean => {
    // Users can always edit their own display name
    if (isCurrentUser(adminUser)) return true;
    
    if (!canEditUsers) return false;
    if (isSuperAdmin) return true; // Super admin can edit anyone
    
    const targetRole = getUserRole(adminUser.id);
    // Admins can only edit display names of editors, not super_admins or admins
    return hasAdminRole && targetRole === 'editor';
  };

  // Check if user can reset password - admins and super admins can reset anyone's password (including themselves)
  const canResetUserPassword = (adminUser: AdminUser): boolean => {
    if (!hasAdminRole && !isSuperAdmin) return false;
    if (isSuperAdmin) return true; // Super admin can reset anyone's password
    
    const targetRole = getUserRole(adminUser.id);
    // Admins can reset their own password and editors' passwords
    return isCurrentUser(adminUser) || targetRole === 'editor';
  };

  const getAvailableRoles = (): AppRole[] => {
    if (isSuperAdmin) {
      return ['editor', 'sales_rep', 'distributor', 'admin', 'super_admin'];
    }
    // Admins can assign editor, sales_rep and distributor roles
    return ['editor', 'sales_rep', 'distributor'];
  };

  const handleAddUser = async () => {
    if (isViewingAs) {
      toast.info('View-only mode: Changes are not saved while viewing as another role');
      setIsAddDialogOpen(false);
      return;
    }
    
    if (!newEmail || !newDisplayName || !newPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: newEmail,
          password: newPassword,
          displayName: newDisplayName,
          role: newRole,
          forcePasswordChange
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Send credentials email if checkbox is checked
      if (sendCredentialsEmail) {
        await supabase.functions.invoke('send-credentials-email', {
          body: {
            email: newEmail,
            password: newPassword,
            displayName: newDisplayName,
            role: newRole,
            loginUrl: `${window.location.origin}/admin/login`
          }
        });
        toast.success('User created and credentials sent via email');
      } else {
        toast.success('User created successfully');
      }

      // Log activity for user creation
      await logActivity({
        action: 'create',
        resourceType: 'user',
        resourceName: newEmail,
        details: {
          display_name: newDisplayName,
          role: newRole,
          method: 'direct_creation',
          credentials_emailed: sendCredentialsEmail
        }
      });

      setIsAddDialogOpen(false);
      setNewEmail('');
      setNewDisplayName('');
      setNewPassword('');
      setNewRole('editor');
      setShowNewPassword(false);
      setForcePasswordChange(true);
      setSendCredentialsEmail(false);
      fetchUsers();
    } catch (error) {
      const msg: string = error.message || 'Failed to add user';
      if (msg.includes('pending invitation')) {
        toast.error(
          'A pending invitation already exists for this email. Cancel the invitation first (see the Pending Invitations tab), then try again.',
          { duration: 8000 }
        );
      } else if (msg.includes('already exists')) {
        toast.error('A user with this email already exists.', { duration: 6000 });
      } else {
        toast.error(msg, {
          description: `If this keeps happening, email support with the page URL and describe the issue.`,
          duration: 8000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteUser = async () => {
    if (isViewingAs) {
      toast.info('View-only mode: Changes are not saved while viewing as another role');
      setIsInviteDialogOpen(false);
      return;
    }
    
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-admin-invite', {
        body: {
          email: inviteEmail,
          role: inviteRole,
          inviterEmail: user?.email,
          inviterName: currentUserDisplayName || user?.email
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Log activity for invitation
      await logActivity({
        action: 'create',
        resourceType: 'invitation',
        resourceName: inviteEmail,
        details: {
          role: inviteRole,
          method: 'email_invitation'
        }
      });

      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('editor');
      fetchInvitations();
    } catch (error) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (isViewingAs) {
      toast.info('View-only mode: Changes are not saved while viewing as another role');
      return;
    }
    
    try {
      await supabase
        .from('pending_invitations')
        .delete()
        .eq('id', invitationId);

      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitation: PendingInvitation) => {
    if (isViewingAs) {
      toast.info('View-only mode: Changes are not saved while viewing as another role');
      return;
    }

    setIsSubmitting(true);

    try {
      // Delete the old invitation
      await supabase
        .from('pending_invitations')
        .delete()
        .eq('id', invitation.id);

      // Send a new invitation
      const { data, error } = await supabase.functions.invoke('send-admin-invite', {
        body: {
          email: invitation.email,
          role: invitation.role,
          inviterEmail: user?.email,
          inviterName: currentUserDisplayName || user?.email
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Invitation resent to ${invitation.email}`);
      fetchInvitations();
    } catch (error) {
      toast.error(error.message || 'Failed to resend invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    if (isViewingAs) {
      toast.info('View-only mode: Changes are not saved while viewing as another role');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      return;
    }

    // Validate password if provided
    if (editPassword && editPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    const previousRole = getUserRole(selectedUser.id);

    try {
      // Update display name and role
      await supabase
        .from('admin_users')
        .update({
          display_name: editDisplayName,
          role: editRole as any // Cast to any since super_admin is a new enum value
        })
        .eq('id', selectedUser.id);

      const existingRole = userRoles.find(r => r.user_id === selectedUser.id);
      if (existingRole) {
        await supabase
          .from('user_roles')
          .update({ role: editRole as any }) // Cast to any since super_admin is a new enum value
          .eq('id', existingRole.id);
      } else {
        await supabase.from('user_roles').insert({
          user_id: selectedUser.id,
          role: editRole as any // Cast to any since super_admin is a new enum value
        });
      }

      // Update password if provided
      let passwordUpdated = false;
      if (editPassword) {
        const { data, error: pwError } = await supabase.functions.invoke('admin-update-password', {
          body: {
            targetUserId: selectedUser.id,
            newPassword: editPassword
          }
        });

        if (pwError) throw pwError;
        if (data?.error) throw new Error(data.error);
        passwordUpdated = true;
      }

      // Log activity
      await logActivity({
        action: 'update',
        resourceType: 'user',
        resourceId: selectedUser.id,
        resourceName: selectedUser.email,
        details: {
          display_name: editDisplayName,
          previous_role: previousRole,
          new_role: editRole,
          password_changed: passwordUpdated
        }
      });

      toast.success(passwordUpdated ? 'User updated and password changed' : 'User updated successfully');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setEditPassword('');
      setShowEditPassword(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (isViewingAs) {
      toast.info('View-only mode: Changes are not saved while viewing as another role');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      return;
    }

    setIsSubmitting(true);

    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      await supabase
        .from('admin_users')
        .delete()
        .eq('id', selectedUser.id);

      // Log activity
      await logActivity({
        action: 'delete',
        resourceType: 'user',
        resourceId: selectedUser.id,
        resourceName: selectedUser.email,
        details: {
          display_name: selectedUser.display_name,
          role: getUserRole(selectedUser.id)
        }
      });

      toast.success('User removed successfully');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to remove user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (adminUser: AdminUser) => {
    setSelectedUser(adminUser);
    setEditDisplayName(adminUser.display_name);
    setEditRole(getUserRole(adminUser.id));
    setEditPassword('');
    setShowEditPassword(false);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (adminUser: AdminUser) => {
    setSelectedUser(adminUser);
    setDeleteDialogOpen(true);
  };

  const openResetPasswordDialog = (adminUser: AdminUser) => {
    setResetPasswordUser(adminUser);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;

    if (isViewingAs) {
      toast.info('View-only mode: Changes are not saved while viewing as another role');
      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
      return;
    }

    setIsResettingPassword(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-password-reset', {
        body: {
          targetUserId: resetPasswordUser.id,
          targetEmail: resetPasswordUser.email,
          targetDisplayName: resetPasswordUser.display_name
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Log activity
      await logActivity({
        action: 'update',
        resourceType: 'user',
        resourceId: resetPasswordUser.id,
        resourceName: resetPasswordUser.email,
        details: {
          action: 'password_reset_triggered',
          triggered_by: user?.email
        }
      });

      toast.success(`Password reset email sent to ${resetPasswordUser.email}`);
      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'sales_rep': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'admin': return <ShieldCheck className="w-5 h-5 text-primary" />;
      case 'sales_rep': return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case 'distributor': return <Handshake className="w-5 h-5 text-sky-500" />;
      default: return <Users className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatRoleName = (role: AppRole): string => {
    return roleLabels[role] || role;
  };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const userActivity = (u: AdminUser): 'active' | 'inactive' | 'never' =>
    !u.last_login_at ? 'never' : new Date(u.last_login_at) < thirtyDaysAgo ? 'inactive' : 'active';
  const toggleStatus = (v: typeof statusFilter) => setStatusFilter(statusFilter === v ? 'all' : v);
  const userQuery = searchQuery.trim().toLowerCase();
  const loginTime = (u: AdminUser) => (u.last_login_at ? new Date(u.last_login_at).getTime() : 0);
  const visibleUsers = users
    .filter(u => statusFilter === 'all' || userActivity(u) === statusFilter)
    .filter(u => roleFilter === 'all' || getUserRole(u.id) === roleFilter)
    .filter(u => !userQuery || [u.display_name, u.email].some(v => v?.toLowerCase().includes(userQuery)))
    .sort((a, b) => {
      if (sortValue === 'name_desc') return (b.display_name || '').localeCompare(a.display_name || '');
      if (sortValue === 'login_desc') return loginTime(b) - loginTime(a);
      if (sortValue === 'login_asc') return loginTime(a) - loginTime(b);
      return (a.display_name || '').localeCompare(b.display_name || '');
    });

  if (!canViewUsers) {
    return <AccessDenied message="Only admins can manage users." requiredRole="Admin or Super Admin" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Band 1 — title. View As, Invite and Add user open their own dialogs,
          so they stay with the title rather than in a role-gated row: this
          whole page is already admin-only. */}
      <AdminPageHeader
        title="User Management"
        description={isViewingAs
          ? `Manage admin users and their roles. Viewing as ${roleLabels[viewAsRole!]}.`
          : `Manage admin users and their roles${isSuperAdmin ? ' (Super Admin)' : ''}`}
        icon={<Users className="h-4 w-4" />}
        onRefresh={() => { fetchUsers(); fetchInvitations(); }}
        isLoading={isLoading}
        actions={
        <div className="flex gap-2 flex-wrap items-center">
          {/* View As Dropdown Button */}
          {canUseViewAs && (
            isViewingAs ? (
              <Button
                variant="outline"
                size="sm"
                onClick={clearViewAs}
                className="h-9 text-amber-600 border-amber-400 hover:bg-amber-500/10 dark:text-amber-400 touch-manipulation"
              >
                <X className="h-4 w-4 mr-1.5" />
                Exit View As
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 touch-manipulation">
                    <Eye className="h-4 w-4 mr-1.5" />
                    View As
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Test permissions as</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableViewAsRoles.map((role) => (
                    <DropdownMenuItem key={role} onClick={() => setViewAsRole(role as AppRole)}>
                      {roleLabels[role]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          )}
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Invite User via Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map(role => (
                        <SelectItem key={role} value={role}>
                          {formatRoleName(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  An invitation email will be sent with a link to create their account.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleInviteUser} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add User Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="John Doe"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-manipulation p-1"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Generate password"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
                        let pw = '';
                        const arr = new Uint32Array(16);
                        crypto.getRandomValues(arr);
                        for (let i = 0; i < 16; i++) pw += chars[arr[i] % chars.length];
                        setNewPassword(pw);
                        setShowNewPassword(true);
                      }}
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map(role => (
                        <SelectItem key={role} value={role}>
                          {formatRoleName(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="forcePasswordChange"
                    checked={forcePasswordChange}
                    onCheckedChange={(checked) => setForcePasswordChange(checked === true)}
                  />
                  <Label htmlFor="forcePasswordChange" className="text-sm font-normal cursor-pointer">
                    Require password change on first login
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendCredentials"
                    checked={sendCredentialsEmail}
                    onCheckedChange={(checked) => setSendCredentialsEmail(checked === true)}
                  />
                  <Label htmlFor="sendCredentials" className="text-sm font-normal cursor-pointer">
                    Send login credentials via email
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddUser} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        }
      />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Pending Invitations ({pendingInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="diy-access" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            DIY Quote Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Band 2 — tiles. Each one filters the list below. */}
          <AdminMetricsStrip
            metrics={[
              { label: 'All users', value: users.length, active: statusFilter === 'all', onClick: () => setStatusFilter('all') },
              { label: 'Active, last 30 days', value: users.filter(u => userActivity(u) === 'active').length, tone: 'good', active: statusFilter === 'active', onClick: () => toggleStatus('active') },
              { label: 'Inactive 30+ days', value: users.filter(u => userActivity(u) === 'inactive').length, tone: 'warn', active: statusFilter === 'inactive', onClick: () => toggleStatus('inactive') },
              { label: 'Never logged in', value: users.filter(u => userActivity(u) === 'never').length, tone: 'warn', active: statusFilter === 'never', onClick: () => toggleStatus('never') },
            ]}
          />

          {/* Band 3 — the shared toolbar: Search · Sort · Status, then Role. */}
          <AdminToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search by name or email..."
            resultCount={visibleUsers.length}
            resultNoun="users"
            filters={[
              {
                key: 'sort',
                label: 'Sort',
                value: sortValue,
                onChange: setSortValue,
                allValue: 'name_asc',
                options: [
                  { value: 'name_asc', label: 'Name A-Z' },
                  { value: 'name_desc', label: 'Name Z-A' },
                  { value: 'login_desc', label: 'Last login, newest' },
                  { value: 'login_asc', label: 'Last login, oldest' },
                ],
              },
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: (v) => setStatusFilter(v as typeof statusFilter),
                options: [
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active, last 30 days' },
                  { value: 'inactive', label: 'Inactive 30+ days' },
                  { value: 'never', label: 'Never logged in' },
                ],
              },
              {
                key: 'role',
                label: 'Role',
                value: roleFilter,
                onChange: setRoleFilter,
                options: [
                  { value: 'all', label: 'All roles' },
                  ...Array.from(new Set(users.map(u => getUserRole(u.id)))).map(r => ({ value: r, label: formatRoleName(r) })),
                ],
              },
            ]}
            onClearAll={() => { setSearchQuery(''); setStatusFilter('all'); setRoleFilter('all'); setSortValue('name_asc'); }}
          />

          <div className="grid gap-4">
            {visibleUsers
              .map((adminUser) => {
              const userRole = getUserRole(adminUser.id);
              const canEditRole = canEditUserRole(adminUser);
              const canEditName = canEditUserDisplayName(adminUser);
              const canDelete = canDeleteUser(adminUser);
              const canResetPassword = canResetUserPassword(adminUser);
              const isSelf = isCurrentUser(adminUser);
              const diyStatus = diyStatuses[adminUser.id];

              return (
                <Card key={adminUser.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getRoleIcon(userRole)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{adminUser.display_name}</span>
                          <Badge variant={getRoleBadgeVariant(userRole)}>
                            {formatRoleName(userRole)}
                          </Badge>
                          {isSelf && (
                            <Badge variant="outline">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{adminUser.email}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>
                            {adminUser.last_login_at 
                              ? `Last login ${format(new Date(adminUser.last_login_at), 'MMM d, yyyy h:mm a')}`
                              : 'Never logged in'}
                          </span>
                        </div>
                        {diyStatus && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">DIY Quote access:</span>
                            <StatusBadge status={diyStatus} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canUseViewAs && !isSelf && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title={`View as ${adminUser.display_name}`}
                          onClick={() => setViewAsRole(userRole, {
                            userId: adminUser.id,
                            email: adminUser.email,
                            displayName: adminUser.display_name,
                          })}
                          className="touch-manipulation"
                        >
                          <Eye className="h-4 w-4 text-amber-500" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Reset Password"
                        onClick={() => openResetPasswordDialog(adminUser)}
                        disabled={!canResetPassword}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Edit User"
                        onClick={() => openEditDialog(adminUser)}
                        disabled={!canEditName && !canEditRole}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Delete User"
                        onClick={() => openDeleteDialog(adminUser)}
                        disabled={!canDelete}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}

            {users.length > 0 && visibleUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users match these filters</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <div className="grid gap-4">
            {pendingInvitations.map((invitation) => {
              const isExpired = new Date(invitation.expires_at) < new Date();
              
              return (
                <Card key={invitation.id} className={isExpired ? 'opacity-60' : ''}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{invitation.email}</span>
                          <Badge variant={getRoleBadgeVariant(invitation.role)}>
                            {formatRoleName(invitation.role)}
                          </Badge>
                          {isExpired && (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {isExpired ? 'Expired' : `Expires ${format(new Date(invitation.expires_at), 'MMM d, yyyy')}`}
                          </span>
                          <span>•</span>
                          <span>Invited by {invitation.invited_by_email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpired && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResendInvitation(invitation)}
                          disabled={isSubmitting}
                          className="gap-1.5"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                          Resend
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {pendingInvitations.length === 0 && (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending invitations</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="diy-access" className="space-y-4">
          <DIYAccessRequestsTab />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">Display Name</Label>
              <Input
                id="editDisplayName"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                disabled={!selectedUser || !canEditUserDisplayName(selectedUser)}
              />
              {selectedUser && isCurrentUser(selectedUser) && (
                <p className="text-xs text-muted-foreground">Editing your own display name</p>
              )}
              {selectedUser && !isCurrentUser(selectedUser) && !canEditUserDisplayName(selectedUser) && (
                <p className="text-xs text-muted-foreground">You cannot edit this user's display name</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select 
                value={editRole} 
                onValueChange={(v) => setEditRole(v as AppRole)}
                disabled={!selectedUser || isCurrentUser(selectedUser) || !canEditUserRole(selectedUser)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map(role => (
                    <SelectItem key={role} value={role}>
                      {formatRoleName(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUser && isCurrentUser(selectedUser) && (
                <p className="text-xs text-muted-foreground">You cannot change your own role</p>
              )}
              {selectedUser && !isCurrentUser(selectedUser) && !canEditUserRole(selectedUser) && (
                <p className="text-xs text-muted-foreground">You cannot change this user's role</p>
              )}
            </div>
            
            {/* Password Change Section */}
            {selectedUser && canResetUserPassword(selectedUser) && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editPassword">Change Password</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="text-xs h-7"
                  >
                    {showEditPassword ? 'Cancel' : 'Set New Password'}
                  </Button>
                </div>
                {showEditPassword && (
                  <>
                    <Input
                      id="editPassword"
                      type="password"
                      placeholder="Enter new password (min 8 characters)"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to keep the current password
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.display_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Confirmation */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Send a password reset email to <strong>{resetPasswordUser?.display_name}</strong> ({resetPasswordUser?.email})?
              They will receive an email with a link to create a new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={isResettingPassword}>
              {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <KeyRound className="mr-2 h-4 w-4" />
              Send Reset Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
