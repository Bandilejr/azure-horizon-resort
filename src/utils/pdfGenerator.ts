import html2pdf from 'html2pdf.js';

interface PdfOptions {
  filename?: string;
  margin?: [number, number, number, number];
}

export const generatePDF = async (element: HTMLElement, filename: string, options?: PdfOptions) => {
  const defaultOptions = {
    margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, letterRendering: true, useCORS: true },
    jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
  };

  const mergedOptions = { ...defaultOptions, ...options };
  await html2pdf().set(mergedOptions).from(element).save();
};

export const generatePDFFromHTML = async (html: string, filename: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const element = iframe.contentWindow?.document?.body;
    if (element) {
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true, useCORS: true },
        jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      await html2pdf().set(opt).from(element).save();
    }
    document.body.removeChild(iframe);
  } else {
    document.body.removeChild(iframe);
    throw new Error('Could not generate PDF');
  }
};

export const getProfessionalPDFHTML = (content: {
  title: string;
  guestName: string;
  details: Array<{ label: string; value: string }>;
  items?: Array<{ name: string; quantity: number; price: number; subtotal: number }>;
  subtotal?: number;
  tax?: number;
  total: number;
  footer?: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${content.title}</title>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: white;
            padding: 40px;
          }
          .document {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.05);
          }
          .header {
            background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .hotel-name {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 2px;
          }
          .hotel-tagline {
            font-size: 11px;
            opacity: 0.8;
            margin-top: 5px;
            letter-spacing: 1px;
          }
          .title-bar {
            background: #c9a227;
            color: #1e3a5f;
            padding: 12px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            letter-spacing: 2px;
          }
          .content {
            padding: 30px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e3a5f;
            border-bottom: 2px solid #c9a227;
            padding-bottom: 8px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .detail-item {
            display: flex;
            flex-direction: column;
          }
          .detail-label {
            font-size: 10px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            font-size: 14px;
            font-weight: 500;
            color: #333;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th {
            background: #f8f8f8;
            padding: 12px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            color: #555;
            text-transform: uppercase;
            border-bottom: 2px solid #e0e0e0;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
          }
          .totals {
            text-align: right;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            gap: 30px;
            margin-bottom: 8px;
          }
          .total-label {
            font-size: 13px;
            color: #666;
          }
          .total-amount {
            font-size: 13px;
            font-weight: 500;
            min-width: 100px;
            text-align: right;
          }
          .grand-total {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #c9a227;
          }
          .grand-total .total-label {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a5f;
          }
          .grand-total .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a5f;
          }
          .footer {
            background: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
          }
          .status-confirmed { background: #2196f3; color: white; }
          .status-checked_in { background: #4caf50; color: white; }
          .status-completed { background: #9e9e9e; color: white; }
          .status-cancelled { background: #f44336; color: white; }
        </style>
      </head>
      <body>
        <div class="document">
          <div class="header">
            <div class="hotel-name">AZURE HORIZON RESORT</div>
            <div class="hotel-tagline">Excellence in Hospitality</div>
          </div>
          <div class="title-bar">${content.title}</div>
          <div class="content">
            <div class="section">
              <div class="section-title">Guest Information</div>
              <div class="details-grid">
                ${content.details.map(detail => `
                  <div class="detail-item">
                    <span class="detail-label">${detail.label}</span>
                    <span class="detail-value">${detail.value}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            ${content.items && content.items.length > 0 ? `
              <div class="section">
                <div class="section-title">Order Summary</div>
                <table>
                  <thead>
                    <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    ${content.items.map(item => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>R ${item.price.toFixed(2)}</td>
                        <td>R ${item.subtotal.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="totals">
                  ${content.subtotal !== undefined ? `<div class="total-row"><span class="total-label">Subtotal:</span><span class="total-amount">R ${content.subtotal.toFixed(2)}</span></div>` : ''}
                  ${content.tax !== undefined ? `<div class="total-row"><span class="total-label">Tax (10%):</span><span class="total-amount">R ${content.tax.toFixed(2)}</span></div>` : ''}
                  <div class="total-row grand-total"><span class="total-label">TOTAL:</span><span class="total-amount">R ${content.total.toFixed(2)}</span></div>
                </div>
              </div>
            ` : `
              <div class="section">
                <div class="section-title">Charges Summary</div>
                <div class="totals">
                  <div class="total-row grand-total"><span class="total-label">TOTAL AMOUNT:</span><span class="total-amount">R ${content.total.toFixed(2)}</span></div>
                </div>
              </div>
            `}
            <div class="footer">
              <p>${content.footer || 'Thank you for choosing Azure Horizon Resort!'}</p>
              <p style="margin-top: 5px;">This is a system-generated document.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};