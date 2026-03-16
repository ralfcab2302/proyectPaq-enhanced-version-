import { Injectable } from '@angular/core';
import { Salida } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ExportService {

  private formatearFila(s: Salida) {
    return {
      'Código': s.codigo,
      'Código de barras': s.codigo_barras,
      'Nº Salida': s.nro_salida,
      'Empresa': s.nombre_empresa,
      'Fecha': new Date(s.fecha_salida).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
    };
  }

  exportarExcel(salidas: Salida[], nombre = 'salidas') {
    const XLSX = (window as any).XLSX;
    const datos = salidas.map(s => this.formatearFila(s));
    const ws = XLSX.utils.json_to_sheet(datos);

    // Ancho de columnas
    ws['!cols'] = [
      { wch: 8 }, { wch: 18 }, { wch: 10 }, { wch: 20 }, { wch: 18 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salidas');
    XLSX.writeFile(wb, `${nombre}_${this.fechaHoy()}.xlsx`);
  }

  exportarPDF(salidas: Salida[], nombre = 'salidas') {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('PaqTracer — Informe de salidas', 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} · ${salidas.length} registros`, 14, 23);

    (doc as any).autoTable({
      startY: 28,
      head: [['Código', 'Código de barras', 'Nº Salida', 'Empresa', 'Fecha']],
      body: salidas.map(s => [
        s.codigo,
        s.codigo_barras,
        s.nro_salida,
        s.nombre_empresa,
        new Date(s.fecha_salida).toLocaleDateString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`${nombre}_${this.fechaHoy()}.pdf`);
  }

  private fechaHoy(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
