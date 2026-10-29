/**
 * Dynamic import utilities for heavy libraries
 * These libraries are loaded on-demand to reduce initial bundle size
 */

// Lazy load jsPDF - only when PDF generation is needed
export async function loadJsPDF() {
  const { default: jsPDF } = await import('jspdf');
  return jsPDF;
}

// Lazy load html2canvas - only when screenshot/capture is needed
export async function loadHtml2Canvas() {
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas;
}

// Lazy load both for combined PDF generation from HTML
export async function loadPDFTools() {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);
  return { jsPDF, html2canvas };
}

// Lazy load QRCode
export async function loadQRCode() {
  const QRCode = await import('qrcode');
  return QRCode;
}

// Lazy load canvas-confetti
export async function loadConfetti() {
  const { default: confetti } = await import('canvas-confetti');
  return confetti;
}

// Generate PDF with lazy-loaded jsPDF
export async function generatePDF(options: {
  title: string;
  content: Record<string, unknown>;
  filename: string;
}) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF();
  
  // Basic PDF generation - can be extended
  doc.setFontSize(24);
  doc.text(options.title, 20, 25);
  
  doc.save(options.filename);
  return doc;
}
