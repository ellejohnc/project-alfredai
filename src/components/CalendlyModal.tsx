import { GHLBookingModal } from "@/components/GHLBookingWidget";

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional lead data to pre-fill the booking form */
  leadData?: {
    name?: string;
    email?: string;
    company?: string;
  };
}

/**
 * Legacy CalendlyModal component - now uses GHL widget instead
 * Kept for backwards compatibility with existing imports
 */
const CalendlyModal = ({ isOpen, onClose, leadData }: CalendlyModalProps) => {
  return (
    <GHLBookingModal
      isOpen={isOpen}
      onClose={onClose}
      leadData={leadData}
      title="Book an Impact Conversation"
      description="30-minute working session to explore how alfred ai can drive measurable outcomes for your organisation."
    />
  );
};

export default CalendlyModal;
