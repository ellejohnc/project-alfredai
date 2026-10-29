import { ChevronDown, HardHat, Building2, Users, Compass, Hammer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROFESSIONAL_ROLES } from "./demoData";
import type { ProfessionalRole } from "./types";

interface ProfessionalRoleSelectorProps {
  selectedRole: string;
  onRoleChange: (roleId: string) => void;
}

const ROLE_ICONS: Record<string, typeof HardHat> = {
  engineers: HardHat,
  certifiers: Building2,
  consultants: Users,
  surveyors: Compass,
  contractors: Hammer,
};

export function ProfessionalRoleSelector({
  selectedRole,
  onRoleChange,
}: ProfessionalRoleSelectorProps) {
  const currentRole = PROFESSIONAL_ROLES.find(r => r.id === selectedRole);
  const Icon = ROLE_ICONS[selectedRole] || HardHat;

  return (
    <div id="tr-role-selector">
      <Select value={selectedRole} onValueChange={onRoleChange}>
        <SelectTrigger className="w-[180px] h-9 bg-card border-border">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <SelectValue placeholder="Select role" />
          </div>
        </SelectTrigger>
      <SelectContent className="bg-card border-border z-[60]">
        {PROFESSIONAL_ROLES.map((role) => {
          const RoleIcon = ROLE_ICONS[role.id] || HardHat;
          return (
            <SelectItem key={role.id} value={role.id} className="min-h-[44px]">
              <div className="flex items-center gap-2">
                <RoleIcon className="w-4 h-4" />
                <span>{role.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
    </div>
  );
}
