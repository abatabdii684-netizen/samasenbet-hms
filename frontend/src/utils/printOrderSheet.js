/**
 * Prints a pre-filled Order Sheet for the given patient.
 * Called right after patient registration.
 */

const HOSPITAL = 'YOHANNES FANTAYE METASEBIYA GENERAL HOSPITAL PLC';
const AMHARIC  = 'ዮሃንስ ፈንታዬ መታሰቢያ አጠቃላይ ሆስፒታል ኃ/የተ/የግ/ማህበር';

export function printOrderSheet(patient) {
  const name     = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
  const cardNo   = patient.patientId || '';
  const sex      = patient.gender    || '';
  const dob      = patient.dateOfBirth;
  const age      = dob
    ? Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25))
    : '';

  const dots  = (n) => '.'.repeat(n);
  const today = new Date().toLocaleDateString('en-GB');

  const orderRows = [
    'DX :',
    '', '',
    'Condition :',
    'Activity',
    'Vital Sign',
    'Diet',
    'Nursing care',
    'Investigation',
    '',
    'Treatment',
    '', '', '', '', '', '', '', '', '', '', '',
  ];

  const rowsHtml = orderRows.map(label => `
    <tr>
      <td style="border:1px solid #000;padding:2px 4px;height:22px;">&nbsp;</td>
      <td style="border:1px solid #000;padding:2px 4px;">&nbsp;</td>
      <td style="border:1px solid #000;padding:2px 4px;">${label}&nbsp;</td>
      <td style="border:1px solid #000;padding:2px 4px;">&nbsp;</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Order Sheet — ${name}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11px;
          color: #000;
          margin: 0; padding: 0;
        }
        * { box-sizing: border-box; }
        .wrap { padding: 8px; border: 1px solid #000; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 2px 4px; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .header-title {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 3px;
          margin-top: 4px;
        }
        .patient-info { margin-bottom: 6px; }
        .underline-row {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 140px;
        }
        .underline-short {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 50px;
        }
      </style>
    </head>
    <body>
      <div class="wrap">

        <!-- Header -->
        <div class="text-center" style="border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px;">
          <div>${AMHARIC}</div>
          <div class="bold">${HOSPITAL}</div>
          <div class="header-title">ORDER SHEET</div>
        </div>

        <!-- Patient info -->
        <div class="patient-info">
          Name of Patient: <span class="underline-row">${name}</span>
          &nbsp;&nbsp;&nbsp;
          Sex: <span class="underline-short">${sex}</span>
          &nbsp;&nbsp;
          Age: <span class="underline-short">${age}</span>
        </div>
        <div class="patient-info">
          Ward &amp; bed No: <span class="underline-row">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          &nbsp;&nbsp;&nbsp;
          Card Number: <span class="underline-row">${cardNo}</span>
        </div>
        <div class="patient-info" style="font-size:10px;color:#555;">
          Registered: ${today}
        </div>

        <!-- Order table -->
        <table style="border:1px solid #000;font-size:10px;margin-top:6px;">
          <thead>
            <tr>
              <th style="border:1px solid #000;padding:3px 6px;width:14%;text-align:left;">Date</th>
              <th style="border:1px solid #000;padding:3px 6px;width:14%;text-align:left;">Time</th>
              <th style="border:1px solid #000;padding:3px 6px;width:58%;text-align:left;">Order</th>
              <th style="border:1px solid #000;padding:3px 6px;width:14%;text-align:left;">Signature</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

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
  setTimeout(() => {
    w.print();
    w.close();
  }, 500);
}
