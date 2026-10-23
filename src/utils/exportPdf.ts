import { jsPDF } from 'jspdf';
import type { Room, FloorObject } from '../types';
import { polygonArea } from './geometry';
import { formatArea } from './format';
import type { Language } from '../i18n';

interface ExportOptions {
  projectName: string;
  rooms: Room[];
  objects: FloorObject[];
  language: Language;
}

export async function exportToPdf(
  stageRef: { toDataURL: (config: { pixelRatio: number; x?: number; y?: number; width?: number; height?: number }) => string } | null,
  options: ExportOptions
): Promise<void> {
  const { projectName, rooms, objects, language } = options;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const footerHeight = 20;
  let yPos = margin;

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(projectName || 'Floor Plan', margin, yPos);

  // Date on the right
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const date = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  pdf.text(date, pageWidth - margin, yPos, { align: 'right' });
  yPos += 8;

  // Canvas image - only rooms and objects (will be captured without grid)
  if (stageRef) {
    try {
      const dataUrl = stageRef.toDataURL({ pixelRatio: 2 });
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = pageHeight - yPos - margin - footerHeight;

      pdf.addImage(dataUrl, 'PNG', margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 5;
    } catch (error) {
      console.error('Failed to capture canvas:', error);
    }
  }

  // Footer with small stats
  const footerY = pageHeight - margin;

  // Draw a light separator line
  pdf.setDrawColor(200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY - 12, pageWidth - margin, footerY - 12);

  // Calculate stats
  const completedRooms = rooms.filter((r) => r.isComplete);
  let totalAreaCm2 = 0;

  for (const room of completedRooms) {
    const corners = room.corners.map((c) => c.position);
    totalAreaCm2 += polygonArea(corners);
  }

  // Stats in a single line
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80);

  const statsText = language === 'en'
    ? `${completedRooms.length} Rooms  •  ${formatArea(totalAreaCm2)}  •  ${objects.length} Objects`
    : `${completedRooms.length} Cômodos  •  ${formatArea(totalAreaCm2)}  •  ${objects.length} Objetos`;

  pdf.text(statsText, margin, footerY - 5);

  // Branding on the right
  pdf.setFontSize(8);
  pdf.setTextColor(150);
  pdf.text('BlueprintOS', pageWidth - margin, footerY - 5, { align: 'right' });

  // Save the PDF
  const filename = `${projectName || 'floor-plan'}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}
