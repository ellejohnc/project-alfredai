/** Sample line items the technical-report demo renders. */

import type { InvoiceItem } from "./types";

// Default mock invoice items
export const MOCK_INVOICE_ITEMS: InvoiceItem[] = [
  {
    description: "Technical Inspection Report - Quarterly Assessment",
    quantity: 1,
    unitPrice: 2500,
    total: 2500,
  },
  {
    description: "Thermal Imaging Analysis",
    quantity: 1,
    unitPrice: 850,
    total: 850,
  },
  {
    description: "IoT Sensor Data Analysis (2,847 readings)",
    quantity: 1,
    unitPrice: 650,
    total: 650,
  },
  {
    description: "Compliance Verification & Documentation",
    quantity: 1,
    unitPrice: 450,
    total: 450,
  },
];
