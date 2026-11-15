import { jsPDF } from 'jspdf';

function drawHeader(doc: jsPDF, title: string, subtitle: string, refCode: string) {
  doc.setFillColor(17, 14, 23);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('xPatagonia B2B', 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(249, 115, 22);
  doc.text(title.toUpperCase(), 14, 22);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8.5);
  doc.text(subtitle, 14, 28);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(refCode, 196, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString('es-AR'), 196, 22, { align: 'right' });
}

export function generatePurchaseOrderPdf(params: {
  rfqId: number | string;
  rfqTitle: string;
  rfqCategory: string;
  supplierCompany: string;
  supplierLocation: string;
  priceLabel: string;
  deliveryDays: number;
  paymentTerms: string;
  notes?: string;
  buyerEmail?: string;
}) {
  const doc = new jsPDF();
  const folio = `OC-${String(params.rfqId).padStart(5, '0')}`;
  drawHeader(
    doc,
    'Orden de Compra B2B',
    'Documento Comercial Emitido desde Comparador RFQ xPatagonia',
    folio
  );

  let y = 44;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Datos del Proveedor Adjudicado', 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Razón Social / Empresa: ${params.supplierCompany}`, 14, y);
  y += 5.5;
  doc.text(`Radicación: ${params.supplierLocation}`, 14, y);
  y += 5.5;
  if (params.buyerEmail) {
    doc.text(`Comprador Emisor: ${params.buyerEmail}`, 14, y);
    y += 5.5;
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Detalle del Requerimiento y Condiciones', 14, y);
  y += 7;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 42, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(params.rfqTitle, 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Rubro: ${params.rfqCategory}`, 18, y + 15);
  doc.text(`Importe Adjudicado: ${params.priceLabel}`, 18, y + 22);
  doc.text(`Plazo de Entrega Pactado: ${params.deliveryDays} días corridos`, 18, y + 29);
  doc.text(`Condición de Pago: ${params.paymentTerms}`, 18, y + 36);
  y += 52;

  if (params.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. Alcance Técnico y Notas', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const wrapped = doc.splitTextToSize(params.notes, 180);
    doc.text(wrapped, 14, y);
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'xPatagonia · Red Industrial Patagónica · Documento generado digitalmente para trazabilidad RFQ.',
    14,
    284
  );

  doc.save(`${folio}_${params.supplierCompany.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function generateLogisticsRemitoPdf(params: {
  trackingCode: string;
  originName: string;
  destinationName: string;
  carrierName: string;
  agreedPriceArs?: number;
  status: string;
  notes?: string | null;
  qrDataUrl?: string;
}) {
  const doc = new jsPDF();
  drawHeader(
    doc,
    'Remito Digital & Carta de Porte',
    'Seguimiento Verificable de Corredor Patagónico',
    params.trackingCode
  );

  let y = 44;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Datos del Transporte y Ruta', 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Transportista: ${params.carrierName}`, 14, y);
  y += 6;
  doc.text(`Origen: ${params.originName}`, 14, y);
  y += 6;
  doc.text(`Destino: ${params.destinationName}`, 14, y);
  y += 6;
  doc.text(`Estado Operativo: ${params.status.toUpperCase()}`, 14, y);
  y += 6;
  if (params.agreedPriceArs && params.agreedPriceArs > 0) {
    doc.text(`Tarifa Acordada: $${Number(params.agreedPriceArs).toLocaleString('es-AR')} ARS`, 14, y);
    y += 6;
  }

  const trackingUrl = `https://www.xpatagonia.online/tracking/${params.trackingCode}`;
  if (params.qrDataUrl) {
    doc.addImage(params.qrDataUrl, 'PNG', 148, 42, 46, 46);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Escanear para tracking vivo', 171, 93, { align: 'center' });
  }

  y = Math.max(y + 8, 102);
  doc.setTextColor(15, 23, 42);
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 22, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('URL Pública de Verificación:', 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(234, 88, 12);
  doc.text(trackingUrl, 18, y + 15);
  y += 32;

  if (params.notes) {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Observaciones de Carga:', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(params.notes, 180), 14, y);
    y += 20;
  }

  y = Math.max(y + 10, 190);
  doc.setDrawColor(148, 163, 184);
  doc.line(14, y, 90, y);
  doc.line(116, y, 196, y);
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Firma / Sello Despacho Origen', 14, y + 5);
  doc.text('Firma / Conformidad Recepción en Destino', 116, y + 5);

  doc.save(`Remito_${params.trackingCode}.pdf`);
}

export function generateVendorPackPdf(params: {
  companyName: string;
  legalName?: string;
  entityType: string;
  cuit: string;
  fiscalCondition?: string;
  bcraSituation?: string;
  province: string;
  city: string;
  address?: string;
  credentialLabel?: string;
  serviceModality?: string;
  description: string;
  categories: string[];
  certifications?: string[];
  website?: string;
  contactEmail?: string;
  phone?: string;
}) {
  const doc = new jsPDF();
  drawHeader(
    doc,
    'Legajo Técnico & Ficha KYB (Vendor Pack)',
    'Documentación Comercial y Fiscal para Homologación de Proveedores',
    params.cuit || 'CUIT EN VALIDACIÓN'
  );

  let y = 44;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(params.companyName || 'Organización B2B', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Perfil: ${params.entityType.toUpperCase()} · ${params.city}, ${params.province}`,
    14,
    y
  );
  y += 10;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Datos Fiscales y Validación KYB', 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  if (params.legalName) {
    doc.text(`Razón Social ARCA: ${params.legalName}`, 14, y);
    y += 5.5;
  }
  doc.text(`CUIT: ${params.cuit || 'No informado'}`, 14, y);
  y += 5.5;
  if (params.fiscalCondition) {
    doc.text(`Condición Impositiva: ${params.fiscalCondition}`, 14, y);
    y += 5.5;
  }
  if (params.bcraSituation) {
    doc.text(`Situación Crediticia BCRA: ${params.bcraSituation}`, 14, y);
    y += 5.5;
  }
  if (params.credentialLabel) {
    doc.text(`Matrícula / Certificación: ${params.credentialLabel}`, 14, y);
    y += 5.5;
  }
  if (params.serviceModality) {
    doc.text(`Modalidad Operativa: ${params.serviceModality}`, 14, y);
    y += 5.5;
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Capacidades, Rubros y Descripción', 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Rubros Activos: ${params.categories.join(', ') || 'Servicios Industriales'}`, 14, y);
  y += 6;
  if (params.certifications && params.certifications.length > 0) {
    doc.text(`Certificaciones: ${params.certifications.join(' · ')}`, 14, y);
    y += 6;
  }
  const descLines = doc.splitTextToSize(params.description || 'Sin descripción cargada.', 180);
  doc.text(descLines, 14, y);
  y += descLines.length * 5 + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. Canales de Contacto Comercial', 14, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  if (params.address) {
    doc.text(`Dirección: ${params.address}`, 14, y);
    y += 5.5;
  }
  if (params.contactEmail) {
    doc.text(`Email Comercial: ${params.contactEmail}`, 14, y);
    y += 5.5;
  }
  if (params.phone) {
    doc.text(`Teléfono / Guardia: ${params.phone}`, 14, y);
    y += 5.5;
  }
  if (params.website) {
    doc.text(`Sitio Web: ${params.website}`, 14, y);
  }

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Generado desde xPatagonia B2B · https://www.xpatagonia.online', 14, 284);

  doc.save(`Legajo_KYB_${(params.companyName || 'Empresa').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
