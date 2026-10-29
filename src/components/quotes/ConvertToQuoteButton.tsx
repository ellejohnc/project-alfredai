/**
 * The button that fires useConvertToQuote.
 *
 * It lived inside the hook file, which stopped that file hot-reloading: a
 * module exporting both a component and a hook makes React Fast Refresh give
 * up and full-reload the page. The COMPONENT moved rather than the hook,
 * because the hook is what the rest of the code imports.
 */
import { Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConvertToQuote, type ConvertToQuoteData } from '@/hooks/useConvertToQuote';

export function ConvertToQuoteButton({
  contactName,
  contactEmail,
  companyName,
  phone,
  industry,
}: ConvertToQuoteData) {
  const { convertToQuote, isConverting } = useConvertToQuote();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
      disabled={isConverting}
      onClick={() =>
        convertToQuote({ contactName, contactEmail, companyName, phone, industry })
      }
    >
      {isConverting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Receipt className="h-4 w-4" />
      )}
      Convert to Quote
    </Button>
  );
}
