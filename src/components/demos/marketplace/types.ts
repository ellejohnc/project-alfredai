import { LucideIcon } from "lucide-react";

export type Integration = {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
  rating: number;
  installs: string;
  description: string;
  longDescription: string;
  color: string;
  installed?: boolean;
  setupTime: string;
  complexity: "easy" | "medium" | "advanced";
  features: string[];
  popular?: boolean;
  new?: boolean;
  supportsAgentProtocol?: boolean;
  setupSteps: SetupStep[];
};

export type SetupStep = {
  id: string;
  title: string;
  description: string;
  type: "auth" | "config" | "mapping" | "sync" | "test";
  duration: number;
  fields?: FormField[];
};

export type FormField = {
  name: string;
  label: string;
  type: "text" | "password" | "select" | "toggle" | "oauth" | "drag-drop";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  defaultValue?: string | boolean;
};

export type InstalledIntegration = Integration & {
  installedAt: Date;
  lastSync?: Date;
  status: "connected" | "syncing" | "error" | "paused";
  syncCount: number;
  errorCount: number;
};

export type WorkflowNode = {
  id: string;
  integrationId: string;
  type: "trigger" | "action";
  label: string;
};

export type Workflow = {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  active: boolean;
};
