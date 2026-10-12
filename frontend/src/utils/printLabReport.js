/**
 * Prints a pre-filled Laboratory Reporting Form
 * from a real lab order object.
 */

const HOSPITAL = 'YOHANNES FANTAYE METASEBIYA GENERAL HOSPITAL PLC';
const AMHARIC  = 'ዮሃንስ ፈንታዬ መታሰቢያ አጠቃላይ ሆስፒታል ኃ/የተ/የግ/ማህበር';
const TEL      = '0221160106 / 022110868';
const EMAIL    = 'info@yfmhospital.com';

export function printLabReport(order) {
  const p       = order.patient;
  const name    = `${p?.firstName || ''} ${p?.lastName || ''}`.trim();
  const cardNo  = p?.patientId || '';
  const dob     = p?.dateOfBirth;
  const age     = dob
    ? Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25))
    : '';
  const sex        = p?.gender     || '';
  const orderNo    = order.orderNo || '';
  const orderDate  = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-GB')
    : '';
  const doctorName = order.doctor
    ? `Dr. ${order.doctor.firstName} ${order.doctor.lastName}`
    : '';
  const techName   = order.technician
    ? `${order.technician.firstName} ${order.technician.lastName}`
    : '';
  const sampleType    = order.sampleType   || '';
  const clinicalInfo  = order.clinicalInfo || '';
  const urgency       = order.urgency      || 'ROUTINE';
  const items         = order.items        || [];

  // ── Group items by category ───────────────────────────────────────
  const grouped = {};
  items.forEach(item => {
    const cat = item.test?.category || 'OTHER';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  // ── Build results rows HTML ───────────────────────────────────────
  const resultRowsHtml = Object.entries(grouped).map(([cat, catItems]) => {
    const catHeader = `
      <tr>
        <td colspan="5"
          style="background:#e8e8e8;font-weight:bold;padding:3px 6px;
                 border:1px solid #000;font-size:9px;letter-spacing:0.5px;">
          ${cat}
        </td>
      </tr>`;

    const itemRows = catItems.map(item => {
      const resultColor = item.isAbnormal ? 'color:red;font-weight:bold;' : '';
      const abnormalTag = item.isAbnormal
        ? '<span style="color:red;font-size:8px;">⚠ ABNORMAL</span>'
        : '';
      return `
        <tr>
          <td style="border:1px solid #000;padding:2px 5px;font-size:9px;">
            ✓ ${item.test?.testName || ''}
            <div style="font-size:8px;color:#666;">${item.test?.testCode || ''}</div>
          </td>
          <td style="border:1px solid #000;padding:2px 5px;font-size:10px;${resultColor}">
            ${item.result || '—'} ${abnormalTag}
          </td>
          <td style="border:1px solid #000;padding:2px 5px;font-size:9px;">
            ${item.unit || item.test?.unit || '—'}
          </td>
          <td style="border:1px solid #000;padding:2px 5px;font-size:9px;">
            ${item.normalRange || item.test?.normalRange || '—'}
          </td>
          <td style="border:1px solid #000;padding:2px 5px;font-size:9px;">
            ${item.remarks || ''}
          </td>
        </tr>`;
    }).join('');

    return catHeader + itemRows;
  }).join('');

  // ── Empty rows if no results ──────────────────────────────────────
  const emptyRows = items.length === 0
    ? Array.from({ length: 15 }).map(() => `
        <tr>
          <td style="border:1px solid #000;padding:2px 5px;height:18px;">&nbsp;</td>
          <td style="border:1px solid #000;padding:2px 5px;">&nbsp;</td>
          <td style="border:1px solid #000;padding:2px 5px;">&nbsp;</td>
          <td style="border:1px solid #000;padding:2px 5px;">&nbsp;</td>
          <td style="border:1px solid #000;padding:2px 5px;">&nbsp;</td>
        </tr>`).join('')
    : '';

  // ── Urgency badge ─────────────────────────────────────────────────
  const urgencyStyle = urgency === 'STAT'
    ? 'background:#fee2e2;color:#dc2626;border:1px solid #dc2626;'
    : urgency === 'URGENT'
      ? 'background:#ffedd5;color:#ea580c;border:1px solid #ea580c;'
      : 'background:#f3f4f6;color:#374151;border:1px solid #9ca3af;';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>Lab Report — ${orderNo} — ${name}</title>
      <style>
        @page  { size: A4; margin: 10mm; }
        body   { font-family: 'Times New Roman', serif; font-size: 11px; color: #000; margin: 0; padding: 0; }
        *      { box-sizing: border-box; }
        table  { width: 100%; border-collapse: collapse; }
        th, td { padding: 2px 4px; }
        .wrap  { padding: 8px; }
        .text-center { text-align: center; }
        .bold  { font-weight: bold; }
        .flex  { display: flex; justify-content: space-between; align-items: flex-start; }
        .line  { display:inline-block; border-bottom:1px solid #000; min-width:120px; }
        .line-sm { display:inline-block; border-bottom:1px solid #000; min-width:50px; }
        .section-label { font-weight: bold; font-size: 9px; color: #555; text-transform: uppercase; margin-bottom: 2px; }
      </style>
    </head>
    <body>
    <div class="wrap">

      <!-- ═══ HEADER ═══ -->
      <div style="border:2px solid #000;padding:8px;margin-bottom:8px;">
        <div class="flex">
          <div>
            <div style="font-size:12px;">${AMHARIC}</div>
            <div class="bold" style="font-size:13px;">${HOSPITAL}</div>
            <div style="font-size:10px;">☎ ${TEL} &nbsp;|&nbsp; ✉ ${EMAIL}</div>
          </div>
          <div style="text-align:right;">
            <div class="bold" style="font-size:14px;letter-spacing:1px;">LABORATORY REPORT</div>
            <div style="font-size:10px;margin-top:2px;">
              Order No: <strong>${orderNo}</strong>
            </div>
            <div style="font-size:10px;">Date: <strong>${orderDate}</strong></div>
            <div style="margin-top:4px;">
              <span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;${urgencyStyle}">
                ${urgency}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ PATIENT INFO ═══ -->
      <div style="border:1px solid #000;padding:6px;margin-bottom:8px;">
        <div class="flex" style="gap:12px;flex-wrap:wrap;">
          <span>Patient Name: <span class="line">${name}</span></span>
          <span>Card No: <span class="line-sm">${cardNo}</span></span>
          <span>Age: <span class="line-sm">${age}</span></span>
          <span>Sex: <span class="line-sm">${sex}</span></span>
        </div>
        <div style="margin-top:4px;" class="flex" style="gap:12px;flex-wrap:wrap;">
          <span>Doctor: <span class="line">${doctorName}</span></span>
          <span>Sample Type: <span class="line-sm">${sampleType}</span></span>
        </div>
        ${clinicalInfo ? `<div style="margin-top:4px;">Clinical Info: <em>${clinicalInfo}</em></div>` : ''}
      </div>

      <!-- ═══ RESULTS TABLE ═══ -->
      <table style="border:1px solid #000;margin-bottom:8px;">
        <thead>
          <tr style="background:#f0f0f0;">
            <th style="border:1px solid #000;padding:3px 6px;text-align:left;width:32%;">Test Name</th>
            <th style="border:1px solid #000;padding:3px 6px;text-align:left;width:20%;">Result</th>
            <th style="border:1px solid #000;padding:3px 6px;text-align:left;width:12%;">Unit</th>
            <th style="border:1px solid #000;padding:3px 6px;text-align:left;width:20%;">Normal Range</th>
            <th style="border:1px solid #000;padding:3px 6px;text-align:left;width:16%;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${resultRowsHtml}
          ${emptyRows}
        </tbody>
      </table>

      <!-- ═══ ABNORMAL SUMMARY ═══ -->
      ${items.some(i => i.isAbnormal) ? `
        <div style="border:1px solid #dc2626;background:#fff5f5;padding:6px;margin-bottom:8px;border-radius:4px;">
          <div style="color:#dc2626;font-weight:bold;margin-bottom:3px;font-size:10px;">⚠ ABNORMAL RESULTS:</div>
          ${items.filter(i => i.isAbnormal).map(i => `
            <div style="font-size:9px;color:#b91c1c;">
              • ${i.test?.testName}: <strong>${i.result}</strong> ${i.unit || ''} 
              (Normal: ${i.normalRange || i.test?.normalRange || '—'})
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- ═══ FOOTER / SIGNATURES ═══ -->
      <div style="border-top:2px solid #000;padding-top:8px;margin-top:8px;">
        <div class="flex" style="gap:20px;">
          <div style="width:45%;">
            <div class="section-label">Lab Technician</div>
            <div>Name: ........................................</div>
            <div style="margin-top:4px;">Signature: .....................................</div>
            <div style="margin-top:4px;">Date: ..........................................</div>
          </div>
          <div style="width:45%;">
            <div class="section-label">Lab Head / Approved By</div>
            <div>Name: <strong>${techName || '........................................'}</strong></div>
            <div style="margin-top:4px;">Signature: .....................................</div>
            <div style="margin-top:4px;">
              Date: ${order.approvedAt
                ? `<strong>${new Date(order.approvedAt).toLocaleDateString('en-GB')}</strong>`
                : '..........................................'}
            </div>
          </div>
        </div>
        <div style="text-align:center;margin-top:10px;font-size:9px;color:#666;border-top:1px dashed #ccc;padding-top:4px;">
          This report is computer-generated by ${HOSPITAL} HMS.
          Report No: ${orderNo} | Generated: ${new Date().toLocaleString('en-GB')}
        </div>
      </div>

    </div>
    </body>
    </html>
  `;

  const w = window.open('', '_blank', 'width=794,height=1123');
  if (!w) {
    alert('Popup blocked. Please allow popups for this site to print.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 500);
}
