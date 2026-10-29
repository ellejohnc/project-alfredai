import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TriangleAlert } from "lucide-react";

interface ResetConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  hasUnsavedChanges?: boolean;
  loadedQuoteId?: string | null;
}

export function ResetConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  hasUnsavedChanges = false,
  loadedQuoteId,
}: ResetConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const getDescription = () => {
    if (loadedQuoteId) {
      return `You are editing quote ${loadedQuoteId}. This will clear all changes and unload the quote. The saved version will not be affected.`;
    }
    if (hasUnsavedChanges) {
      return "You have unsaved changes that will be lost. This will clear all form fields, pricing calculations, payment links, and return the builder to its initial state.";
    }
    return "This will clear all form fields and reset the quote builder to its initial state.";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <TriangleAlert className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <AlertDialogTitle>Start New Quote?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Start Fresh
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
