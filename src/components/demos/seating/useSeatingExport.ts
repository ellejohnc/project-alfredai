import { useCallback } from "react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import type { Table, Seat, Guest, FloorMarker } from "./types";

interface ExportOptions {
  tables: Table[];
  seats: Map<string, Seat[]>;
  guests: Guest[];
  markers: FloorMarker[];
  layoutName?: string;
  canvasElement?: HTMLElement | null;
}

export function useSeatingExport() {
  // Helper to capture canvas as image data
  const captureCanvasImage = useCallback(async (
    canvasElement: HTMLElement | null
  ): Promise<string | null> => {
    if (!canvasElement) return null;

    try {
      const html2canvas = (await import("html2canvas")).default;
      
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: "#0f172a",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Canvas capture error:", error);
      return null;
    }
  }, []);

  // Export as image (PNG)
  const exportAsImage = useCallback(async (
    canvasElement: HTMLElement | null,
    filename: string = "seating-chart"
  ) => {
    if (!canvasElement) {
      toast.error("Canvas not found");
      return;
    }

    try {
      const html2canvas = (await import("html2canvas")).default;
      
      const canvas = await html2canvas(canvasElement, {
        backgroundColor: "#0f172a",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to generate image");
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Image downloaded successfully");
      }, "image/png");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export image");
    }
  }, []);

  // Export as PDF
  const exportAsPDF = useCallback(async (
    options: ExportOptions,
    filename: string = "seating-chart"
  ) => {
    const { tables, seats, guests, canvasElement, layoutName = "Event Seating Chart" } = options;

    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(layoutName, pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 10;

      // Add canvas screenshot if available
      if (canvasElement) {
        const imageData = await captureCanvasImage(canvasElement);
        if (imageData) {
          // Calculate image dimensions to fit on page (centered, taking ~60% of page width)
          const imgWidth = pageWidth * 0.7;
          const imgHeight = imgWidth * 0.6; // Approximate aspect ratio
          const imgX = (pageWidth - imgWidth) / 2;
          
          pdf.addImage(imageData, 'PNG', imgX, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 10;
        }
      }

      // Check if we need a new page for summary
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      // Stats summary
      const seatedCount = guests.filter(g => g.isSeated).length;
      const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Summary", margin, yPos);
      yPos += 7;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`• Total Tables: ${tables.length}`, margin, yPos);
      yPos += 5;
      pdf.text(`• Total Seats: ${totalSeats}`, margin, yPos);
      yPos += 5;
      pdf.text(`• Guests Seated: ${seatedCount}/${guests.length}`, margin, yPos);
      yPos += 5;
      pdf.text(`• Unseated Guests: ${guests.length - seatedCount}`, margin, yPos);
      yPos += 15;

      // Table assignments
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Table Assignments", margin, yPos);
      yPos += 7;

      // Column headers
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Table", margin, yPos);
      pdf.text("Seat", margin + 25, yPos);
      pdf.text("Guest", margin + 40, yPos);
      pdf.text("Company", margin + 90, yPos);
      pdf.text("Tier", margin + 140, yPos);
      yPos += 5;

      // Draw line under headers
      pdf.setDrawColor(200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 3;

      pdf.setFont("helvetica", "normal");

      // Sort tables by table number
      const sortedTables = [...tables].sort((a, b) => a.tableNumber - b.tableNumber);

      for (const table of sortedTables) {
        const tableSeats = seats.get(table.id) || [];
        const assignedSeats = tableSeats.filter(s => s.assignedGuest);

        if (assignedSeats.length === 0) continue;

        for (const seat of assignedSeats) {
          if (!seat.assignedGuest) continue;

          // Check if we need a new page
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }

          const guest = seat.assignedGuest;
          
          pdf.text(`Table ${table.tableNumber}`, margin, yPos);
          pdf.text(`${seat.seatNumber}`, margin + 25, yPos);
          pdf.text(guest.name.substring(0, 25), margin + 40, yPos);
          pdf.text(guest.company.substring(0, 25), margin + 90, yPos);
          pdf.text(guest.tier.toUpperCase(), margin + 140, yPos);
          
          yPos += 5;
        }
      }

      // Unseated guests section
      const unseatedGuests = guests.filter(g => !g.isSeated);
      if (unseatedGuests.length > 0) {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }

        yPos += 10;
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text("Unseated Guests", margin, yPos);
        yPos += 7;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");

        for (const guest of unseatedGuests) {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = margin;
          }

          pdf.text(`• ${guest.name} (${guest.company}) - ${guest.tier.toUpperCase()}`, margin, yPos);
          yPos += 5;
        }
      }

      // Save PDF
      pdf.save(`${filename}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  }, [captureCanvasImage]);

  // Export guest list as CSV
  const exportAsCSV = useCallback((
    options: ExportOptions,
    filename: string = "seating-assignments"
  ) => {
    const { tables, seats, guests } = options;

    try {
      const rows: string[][] = [
        ["Guest Name", "Company", "Email", "Tier", "Table", "Seat", "Status"],
      ];

      // Sort guests
      const sortedGuests = [...guests].sort((a, b) => {
        if (a.isSeated && !b.isSeated) return -1;
        if (!a.isSeated && b.isSeated) return 1;
        return a.name.localeCompare(b.name);
      });

      for (const guest of sortedGuests) {
        let tableName = "";
        let seatNumber = "";

        if (guest.assignedTableId && guest.assignedSeatId) {
          const table = tables.find(t => t.id === guest.assignedTableId);
          const tableSeats = seats.get(guest.assignedTableId);
          const seat = tableSeats?.find(s => s.id === guest.assignedSeatId);
          
          tableName = table ? `Table ${table.tableNumber}` : "";
          seatNumber = seat ? `${seat.seatNumber}` : "";
        }

        rows.push([
          guest.name,
          guest.company,
          guest.email,
          guest.tier.toUpperCase(),
          tableName,
          seatNumber,
          guest.isSeated ? "Seated" : "Unseated",
        ]);
      }

      // Convert to CSV string
      const csvContent = rows
        .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
        .join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSV downloaded successfully");
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export CSV");
    }
  }, []);

  return {
    exportAsImage,
    exportAsPDF,
    exportAsCSV,
  };
}
