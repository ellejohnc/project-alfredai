import { Plus, Circle, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { TableType } from "./types";

interface TableToolbarProps {
  onAddTable: (type: TableType, seats: number) => void;
  onRemoveSelected: () => void;
  selectedTableId: string | null;
  tableCount: number;
}

export function TableToolbar({
  onAddTable,
  onRemoveSelected,
  selectedTableId,
  tableCount,
}: TableToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Add table dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Table
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Round Tables
          </div>
          <DropdownMenuItem onClick={() => onAddTable('round', 6)} className="gap-2">
            <Circle className="h-3.5 w-3.5" />
            <span>Round (6 seats)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddTable('round', 8)} className="gap-2">
            <Circle className="h-3.5 w-3.5" />
            <span>Round (8 seats)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddTable('round', 10)} className="gap-2">
            <Circle className="h-3.5 w-3.5" />
            <span>Round (10 seats)</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Rectangular Tables
          </div>
          <DropdownMenuItem onClick={() => onAddTable('rectangular', 6)} className="gap-2">
            <Square className="h-3.5 w-3.5" />
            <span>Rectangular (6 seats)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddTable('rectangular', 8)} className="gap-2">
            <Square className="h-3.5 w-3.5" />
            <span>Rectangular (8 seats)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddTable('rectangular', 10)} className="gap-2">
            <Square className="h-3.5 w-3.5" />
            <span>Rectangular (10 seats)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove selected table */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
        onClick={onRemoveSelected}
        disabled={!selectedTableId}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove
      </Button>

      {/* Table count badge */}
      <Badge variant="secondary" className="h-6 text-xs">
        {tableCount} tables
      </Badge>
    </div>
  );
}
