import { useState, useRef, useCallback, memo } from 'react';
import { Check, PenLine, Type, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProposalSignatureProps {
  quoteId: string;
  accessCode: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  setupFee?: string | null;
  monthlyRetainer?: string | null;
  onSuccess: () => void;
}

export const ProposalSignature = memo(function ProposalSignature({
  quoteId,
  accessCode,
  companyName,
  contactName,
  contactEmail,
  setupFee,
  monthlyRetainer,
  onSuccess
}: ProposalSignatureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed');
  const [typedName, setTypedName] = useState(contactName || '');
  const [signerEmail, setSignerEmail] = useState(contactEmail || '');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    setHasDrawn(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    // Scale coordinates to account for CSS scaling of the canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    // Scale coordinates to account for CSS scaling of the canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const getSignatureData = useCallback(() => {
    if (signatureType === 'typed') {
      return typedName;
    }
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  }, [signatureType, typedName]);

  const handleSubmit = async () => {
    setError(null);
    
    // Debug: trace access code being sent
    console.log('[ProposalSignature] Submitting with:', {
      quoteId,
      accessCode: accessCode || '(empty)',
      accessCodeLength: accessCode?.length || 0
    });
    
    if (!signerEmail.trim()) {
      setError('Email is required');
      return;
    }
    
    if (signatureType === 'typed' && !typedName.trim()) {
      setError('Please type your name to sign');
      return;
    }
    
    if (signatureType === 'drawn' && !hasDrawn) {
      setError('Please draw your signature');
      return;
    }
    
    if (!termsAccepted) {
      setError('You must accept the terms and conditions');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: signError } = await supabase.functions.invoke('sign-proposal', {
        body: {
          quoteId,
          accessCode: accessCode || '', // Ensure we send string, not undefined
          signerName: signatureType === 'typed' ? typedName : 'Drawn Signature',
          signerEmail,
          signatureData: getSignatureData(),
          signatureType,
          termsAccepted,
          sessionId: crypto.randomUUID()
        }
      });

      if (signError || !data?.success) {
        throw new Error(data?.error || signError?.message || 'Failed to sign proposal');
      }

      setShowSuccess(true);
      toast.success('Proposal signed successfully!');
      
      setTimeout(() => {
        setIsOpen(false);
        onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Signature error:', err);
      setError(err.message || 'Failed to sign proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Proposal Signed!</h2>
            <p className="text-muted-foreground">
              Thank you for signing. Our team will be in touch shortly to begin your project.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Button 
        size="lg" 
        className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-6 text-lg"
        onClick={() => setIsOpen(true)}
      >
        <PenLine className="w-5 h-5 mr-2" />
        Accept & Sign Proposal
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Sign Proposal</DialogTitle>
            <DialogDescription>
              Sign to accept the proposal for {companyName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quote ID</span>
                <span className="font-mono font-medium">{quoteId}</span>
              </div>
              {(setupFee || monthlyRetainer) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Investment</span>
                  <span className="font-semibold text-primary">
                    {setupFee}{setupFee && monthlyRetainer ? ' + ' : ''}{monthlyRetainer}
                  </span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="signer-email">Your Email</Label>
              <Input
                id="signer-email"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <Label>Your Signature</Label>
              <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as 'typed' | 'drawn')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="typed" className="gap-2">
                    <Type className="w-4 h-4" />
                    Type
                  </TabsTrigger>
                  <TabsTrigger value="drawn" className="gap-2">
                    <PenLine className="w-4 h-4" />
                    Draw
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="typed" className="mt-3">
                  <Input
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Type your full name"
                    className="text-lg"
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                  />
                  {typedName && (
                    <div className="mt-3 p-4 border rounded-lg bg-background">
                      <p 
                        className="text-2xl text-center"
                        style={{ fontFamily: "'Dancing Script', cursive" }}
                      >
                        {typedName}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="drawn" className="mt-3">
                  <div className="border rounded-lg bg-background overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={150}
                      className="w-full block touch-none cursor-crosshair"
                      style={{ aspectRatio: '380/150' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={clearCanvas}
                  >
                    Clear
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                I accept the{' '}
                <a href={`/proposal/${quoteId}/ssa`} className="text-primary hover:underline">
                  Standard Service Agreement
                </a>
                {' '}and authorize alfred ai to proceed with the project as outlined in this proposal.
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm & Sign
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
