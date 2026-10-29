// Role-based access control configuration
// Super Admin: Full access to everything
// Admin: Administrator access (can manage users, content, settings)
// Editor: Limited access (can only manage content)

export type AppRole = 'super_admin' | 'admin' | 'editor' | 'sales_rep' | 'distributor';

export interface RolePermissions {
  // Content Management
  canManageBlogPosts: boolean;
  canManageWebinars: boolean;
  canManageGuides: boolean;
  canManageTestimonials: boolean;
  canManageFAQs: boolean;
  canManageDocumentation: boolean;
  
  // User Management
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canInviteUsers: boolean;
  
  // Settings
  canManageEmailTemplates: boolean;
  canViewActivityLogs: boolean;
  canManageScheduledJobs: boolean;
  
  // Leads & Registrations
  canViewLeads: boolean;
  canExportLeads: boolean;
  canViewRegistrations: boolean;

  // Distributor (personal-scope CRM only)
  canManageOwnCrm: boolean;
}

export const rolePermissions: Record<AppRole, RolePermissions> = {
  super_admin: {
    // Full access to everything
    canManageBlogPosts: true,
    canManageWebinars: true,
    canManageGuides: true,
    canManageTestimonials: true,
    canManageFAQs: true,
    canManageDocumentation: true,
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canInviteUsers: true,
    canManageEmailTemplates: true,
    canViewActivityLogs: true,
    canManageScheduledJobs: true,
    canViewLeads: true,
    canExportLeads: true,
    canViewRegistrations: true,
    canManageOwnCrm: true,
  },
  admin: {
    // Administrator access - can manage users (editors only) and all content
    canManageBlogPosts: true,
    canManageWebinars: true,
    canManageGuides: true,
    canManageTestimonials: true,
    canManageFAQs: true,
    canManageDocumentation: true,
    canViewUsers: true,
    canCreateUsers: true, // Can only create editors
    canEditUsers: true,   // Can only edit editors
    canDeleteUsers: true, // Can only delete editors
    canInviteUsers: true, // Can only invite editors
    canManageEmailTemplates: true,
    canViewActivityLogs: true,
    canManageScheduledJobs: true,
    canViewLeads: true,
    canExportLeads: true,
    canViewRegistrations: true,
    canManageOwnCrm: true,
  },
  editor: {
    // Limited access - content management only
    canManageBlogPosts: true,
    canManageWebinars: true,
    canManageGuides: true,
    canManageTestimonials: true,
    canManageFAQs: true,
    canManageDocumentation: true,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canInviteUsers: false,
    canManageEmailTemplates: false,
    canViewActivityLogs: false,
    canManageScheduledJobs: false,
    canViewLeads: false,
    canExportLeads: false,
    canViewRegistrations: false,
    canManageOwnCrm: false,
  },
  sales_rep: {
    // Sales access - leads, meetings, quotes, sales figures. No content management.
    canManageBlogPosts: false,
    canManageWebinars: false,
    canManageGuides: false,
    canManageTestimonials: false,
    canManageFAQs: false,
    canManageDocumentation: false,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canInviteUsers: false,
    canManageEmailTemplates: false,
    canViewActivityLogs: false,
    canManageScheduledJobs: false,
    canViewLeads: true,
    canExportLeads: false,
    canViewRegistrations: false,
    canManageOwnCrm: true,
  },
  distributor: {
    // Channel partner - personal-scope CRM only. No company-wide visibility.
    canManageBlogPosts: false,
    canManageWebinars: false,
    canManageGuides: false,
    canManageTestimonials: false,
    canManageFAQs: false,
    canManageDocumentation: false,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canInviteUsers: false,
    canManageEmailTemplates: false,
    canViewActivityLogs: false,
    canManageScheduledJobs: false,
    canViewLeads: false,
    canExportLeads: false,
    canViewRegistrations: false,
    canManageOwnCrm: true,
  },
};

export const roleLabels: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  sales_rep: 'Sales Rep',
  distributor: 'Consulting Partner / Distributor',
};

export const roleDescriptions: Record<AppRole, string> = {
  super_admin: 'Full access to all features including system settings and user management',
  admin: 'Administrator access to manage content, users (editors only), and settings',
  editor: 'Can create and edit content (blogs, guides, webinars, FAQs, documentation)',
  sales_rep: 'Access to leads, meetings, quotes, and sales figures',
  distributor: 'Channel partner access limited to their own assigned leads, quotes, meetings, and commissions',
};

export function hasPermission(role: AppRole | null, permission: keyof RolePermissions): boolean {
  if (!role) return false;
  return rolePermissions[role]?.[permission] ?? false;
}

export function canManageRole(currentRole: AppRole | null, targetRole: AppRole): boolean {
  if (!currentRole) return false;
  
  // Super admin can manage all roles
  if (currentRole === 'super_admin') return true;
  
  // Admin can manage editors and sales reps
  if (currentRole === 'admin') return targetRole === 'editor' || targetRole === 'sales_rep' || targetRole === 'distributor';
  
  // Editors and sales reps cannot manage any roles
  return false;
}
