import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Receipt, Loader2 } from 'lucide-react';

export interface ConvertToQuoteData {
  contactName?: string;
  contactEmail?: string;
  companyName?: string;
  phone?: string;
  industry?: string;
  notes?: string;
}

export function useConvertToQuote() {
  const [isConverting, setIsConverting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  const convertToQuote = async (data: ConvertToQuoteData) => {
    setIsConverting(true);
    try {
      const { data: newQuote, error } = await supabase
        .from('quotes')
        .insert({
          contact_name: data.contactName || null,
          contact_email: data.contactEmail || null,
          company_name: data.companyName || null,
          industry: data.industry || null,
          notes: data.notes || null,
          status: 'draft',
          created_by: user?.id || null,
        })
        .select('id, quote_id')
        .single();

      if (error) throw error;

      toast.success(`Quote created: ${newQuote.quote_id || newQuote.id}`, {
        description: `${data.contactName || data.contactEmail || 'New lead'} converted to quote`,
      });

      navigate('/admin/quotes');
      return newQuote;
    } catch (err) {
      console.error('Failed to create quote:', err);
      toast.error('Failed to create quote', {
        description: 'Please try again or create manually from the Quotes section.',
      });
      return null;
    } finally {
      setIsConverting(false);
    }
  };

  return { convertToQuote, isConverting };
}
