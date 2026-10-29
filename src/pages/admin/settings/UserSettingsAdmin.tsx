import { useState, useEffect } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, User, Mail, Pencil } from "lucide-react";

const UserSettingsAdmin = () => {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [originalDisplayName, setOriginalDisplayName] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      fetchDisplayName();
    }
  }, [user]);

  const fetchDisplayName = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("admin_users")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.display_name) {
      setDisplayName(data.display_name);
      setOriginalDisplayName(data.display_name);
    }
  };

  const handleDisplayNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a display name.",
        variant: "destructive",
      });
      return;
    }

    if (displayName === originalDisplayName) {
      toast({
        title: "No changes",
        description: "Display name is the same as before.",
      });
      return;
    }

    setIsUpdatingName(true);

    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ display_name: displayName.trim() })
        .eq("id", user?.id);

      if (error) throw error;

      // Log the activity
      await logActivity({
        action: 'update',
        resourceType: 'user',
        resourceId: user?.id,
        resourceName: user?.email || '',
        details: {
          field: 'display_name',
          previous_value: originalDisplayName,
          new_value: displayName.trim()
        }
      });

      setOriginalDisplayName(displayName.trim());
      toast({
        title: "Display name updated",
        description: "Your display name has been changed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating display name",
        description: error.message || "Failed to update display name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      // Log the activity
      await logActivity({
        action: 'update',
        resourceType: 'user',
        resourceId: user?.id,
        resourceName: user?.email || '',
        details: {
          field: 'password',
          action: 'password_changed'
        }
      });

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast({
        title: "Error updating password",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your current account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleDisplayNameUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isUpdatingName || displayName === originalDisplayName}
                    variant={displayName !== originalDisplayName ? "default" : "secondary"}
                  >
                    {isUpdatingName ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">User ID</Label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm text-muted-foreground truncate">
                {user?.id}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={isChangingPassword} className="w-full">
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserSettingsAdmin;
