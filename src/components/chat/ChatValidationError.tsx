import { motion } from "framer-motion";
import { AlertCircle, Clock, Copy, MessageSquare, Shield } from "lucide-react";
import { ValidationErrorType } from "@/lib/chatValidation";

interface ChatValidationErrorProps {
  errorType: ValidationErrorType;
  message: string;
}

const ERROR_ICONS: Record<ValidationErrorType, React.ReactNode> = {
  too_long: <AlertCircle className="w-4 h-4" />,
  too_short: <MessageSquare className="w-4 h-4" />,
  rate_limited: <Clock className="w-4 h-4" />,
  duplicate: <Copy className="w-4 h-4" />,
  gibberish: <MessageSquare className="w-4 h-4" />,
  spam: <Shield className="w-4 h-4" />,
};

const ChatValidationError = ({ errorType, message }: ChatValidationErrorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20"
    >
      {ERROR_ICONS[errorType]}
      <span>{message}</span>
    </motion.div>
  );
};

export default ChatValidationError;
