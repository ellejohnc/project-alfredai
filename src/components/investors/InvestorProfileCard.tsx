import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { User, Building2, Target, DollarSign, ChevronDown, ChevronUp, Pencil, X, Check, Loader2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvestorData {
  id?: string;
  fullName: string;
  email: string;
  firmName: string;
  role: string;
  investmentFocus: string;
  checkSize: string;
  interestReason: string;
}

interface InvestorProfileCardProps {
  data: InvestorData;
  onUpdate: (data: InvestorData) => void;
}

export function InvestorProfileCard({ data, onUpdate }: InvestorProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState(data);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sync with backend if we have an investor ID (not master)
      if (data.id && data.id !== 'master') {
        const accessCode = localStorage.getItem("investor_access_code");
        
        if (accessCode) {
          const { data: result, error } = await supabase.functions.invoke('update-investor-profile', {
            body: {
              investorId: data.id,
              accessCode,
              fullName: editData.fullName,
              checkSize: editData.checkSize,
            },
          });

          if (error || !result?.success) {
            console.error('Error updating investor profile:', error || result?.error);
            toast.error('Failed to save changes');
            setIsSaving(false);
            return;
          }
        }
      }

      // Update local state and storage
      onUpdate(editData);
      localStorage.setItem("investor_data", JSON.stringify(editData));
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed right-4 top-24 z-40 hidden lg:block"
    >
      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden w-72">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 bg-muted/50 cursor-pointer"
          onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-foreground text-sm">Your Profile</span>
          </div>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setIsExpanded(true);
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            {!isEditing && (
              isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Full Name</label>
                      <Input
                        value={editData.fullName}
                        onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Firm Name</label>
                      <div className="h-8 px-3 py-1 bg-muted rounded-md text-sm text-muted-foreground flex items-center">
                        {editData.firmName}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Role</label>
                      <div className="h-8 px-3 py-1 bg-muted rounded-md text-sm text-muted-foreground flex items-center">
                        {editData.role}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Investment Focus</label>
                      <div className="h-8 px-3 py-1 bg-muted rounded-md text-sm text-muted-foreground flex items-center">
                        {editData.investmentFocus}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 pt-1">Firm, Role & Focus can only be changed by admin</p>
                    {editData.checkSize && (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Check Size</label>
                        <Input
                          value={editData.checkSize}
                          onChange={(e) => setEditData({ ...editData, checkSize: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1 h-8" disabled={isSaving}>
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} className="flex-1 h-8" disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <ProfileItem
                      icon={User}
                      label="Name"
                      value={data.fullName}
                    />
                    <ProfileItem
                      icon={Building2}
                      label="Firm"
                      value={data.firmName}
                    />
                    <ProfileItem
                      icon={Briefcase}
                      label="Role"
                      value={data.role}
                    />
                    <ProfileItem
                      icon={Target}
                      label="Focus"
                      value={data.investmentFocus}
                    />
                    {data.checkSize && (
                      <ProfileItem
                        icon={DollarSign}
                        label="Check Size"
                        value={data.checkSize}
                      />
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ProfileItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}
