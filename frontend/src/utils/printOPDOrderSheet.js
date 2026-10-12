/**
 * Prints a fully pre-filled Order Sheet from an OPD Visit object.
 * Includes patient info, vitals, doctor orders, lab tests, prescriptions.
 */

const HOSPITAL = 'YOHANNES FANTAYE METASEBIYA GENERAL HOSPITAL PLC';
const AMHARIC  = 'ዮሃንስ ፈንታዬ መታሰቢያ አጠቃላይ ሆስፒታል ኃ/የተ/የግ/ማህበር';
const TEL      = '0221160106 / 022110868';

export function printOPDOrderSheet(visit) {
  const p      = visit.patient || {};
  const doctor = visit.doctor  || {};
  const triage = visit.triage  || {};

  const name    = `${p.firstName || ''} ${p.lastName || ''}`.trim();
  const cardNo  = p.patientId || '';
  const sex     = p.gender    || '';
  const dob     = p.dateOfBirth;
  const age     = dob
    ? Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25))
    : '';

  const visitNo    = visit.visitNo || '';
  const visitDate  = visit.visitDate
    ? new Date(visit.visitDate).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');
  const doctorName = doctor.firstName
    ? `Dr. ${doctor.firstName} ${doctor.lastName}`
    : '';
  const clinic     = (visit.clinicType || '').replace(/_/g, ' ');

  // ── Vitals row ───────────────────────────────────────────────
  const bp  = triage.bloodPressureSystolic
    ? `${triage.bloodPressureSystolic}/${triage.bloodPressureDiastolic} mmHg`
    : '___/___';
  const temp = triage.temperature    ? `${triage.temperature} °C`  : '______';
  const hr   = triage.pulseRate      ? `${triage.pulseRate} bpm`   : '______';
  const spo2 = triage.oxygenSaturation ? `${triage.oxygenSaturation}%` : '______';
  const wt   = triage.weight         ? `${triage.weight} kg`       : '______';
  const bmi  = triage.bmi            ? `${triage.bmi}`             : '______';

  // ── Chief complaint / Diagnosis ──────────────────────────────
  const complaint  = visit.chiefComplaint || '';
  const diagnosis  = visit.diagnosis      || '';
  const icdCode    = visit.icdCode        ? `(${visit.icdCode})` : '';
  const treatment  = visit.treatment      || '';

  // ── Lab orders ───────────────────────────────────────────────
  const labOrders = (visit.labOrders || []);
  const labRows = labOrders.length > 0
    ? labOrders.map(o => {
        const tests = (o.items || []).map(i => i.test?.testName || '').filter(Boolean).join(', ');
        return `
          <tr>
            <td style="border:1px solid #000;padding:2px 6px;font-size:9px;">${visitDate}</td>
            <td style="border:1px solid #000;padding:2px 6px;font-size:9px;"></td>
            <td style="border:1px solid #000;padding:2px 6px;font-size:10px;">
              <strong>LAB:</strong> ${tests}
              <span style="color:#888;font-size:9px;"> [${o.orderNo}] ${o.urgency || 'ROUTINE'}</span>
            </td>
            <td style="border:1px solid #000;padding:2px 6px;font-size:9px;">${doctorName}</td>
          </tr>`;
      }).join('')
    : `<tr>
        <td style="border:1px solid #000;padding:2px 6px;height:20px;"></td>
        <td style="border:1px solid #000;padding:2px 6px;"></td>
        <td style="border:1px solid #000;padding:2px 6px;font-size:9px;color:#aaa;">No lab orders</td>
        <td style="border:1px solid #000;padding:2px 6px;"></td>
       </tr>`;

  // ── Prescriptions ────────────────────────────────────────────
  const prescriptions = (visit.prescriptions || []);
  const rxRows = prescriptions.length > 0
    ? prescriptions.map(rx => {
        const drugs = (rx.items || []).map(i =>
          `${i.drug?.genericName || ''} ${i.dosage || ''} ${i.frequency || ''} × ${i.duration || ''}`
        ).filter(Boolean);
        return drugs.map((drug, idx) => `
          <tr>
            <td style="border:1px solid #000;padding:2px 6px;font-size:9px;">${idx === 0 ? visitDate : ''}</td>
            <td style="border:1px solid #000;padding:2px 6px;font-size:9px;"></td>
            <td style="border:1px solid #000;padding:2px 6px;font-size:10px;">
              ${idx === 0 ? '<strong>Rx:</strong> ' : '&nbsp;&nbsp;&nbsp;&nbsp;'}${drug}
            </td>
            <td style="border:1px solid #000;padding:2px 6px;font-size:9px;">${idx === 0 ? doctorName : ''}</td>
          </tr>`).join('');
      }).join('')
    : `<tr>
        <td style="border:1px solid #000;padding:2px 6px;height:20px;"></td>
        <td style="border:1px solid #000;padding:2px 6px;"></td>
        <td style="border:1px solid #000;padding:2px 6px;font-size:9px;color:#aaa;">No prescriptions</td>
        <td style="border:1px solid #000;padding:2px 6px;"></td>
       </tr>`;

  // ── Extra blank rows ─────────────────────────────────────────
  const blankRows = Array.from({ length: 14 }).map(() => `
    <tr>
      <td style="border:1px solid #000;padding:2px 6px;height:22px;"></td>
      <td style="border:1px solid #000;padding:2px 6px;"></td>
      <td style="border:1px solid #000;padding:2px 6px;"></td>
      <td style="border:1px solid #000;padding:2px 6px;"></td>
    </tr>`).join('');

  // ── HTML ─────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Order Sheet — ${name} — ${visitNo}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body  { font-family: 'Times New Roman', serif; font-size: 11px; color: #000; margin:0; padding:0; }
    *     { box-sizing: border-box; }
    .wrap { padding: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2px 4px; }
    .center { text-align: center; }
    .bold   { font-weight: bold; }
    .line   { display:inline-block; border-bottom:1px solid #000; min-width:120px; }
    .line-s { display:inline-block; border-bottom:1px solid #000; min-width:50px; }
    .line-l { display:inline-block; border-bottom:1px solid #000; min-width:200px; }
    .row    { margin-bottom: 4px; }
    .sec    { font-weight:bold; font-size:10px; text-transform:uppercase;
              background:#e8e8e8; padding:2px 6px; border:1px solid #000; }
    .vital-box { display:inline-block; border:1px solid #000; padding:2px 8px;
                 font-size:10px; margin:2px; min-width:80px; text-align:center; }
  </style>
</head>
<body>
<div class="wrap">

  <!-- ═══ HEADER ═══ -->
  <div style="border:2px solid #000;padding:6px 8px;margin-bottom:6px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:11px;">${AMHARIC}</div>
        <div class="bold" style="font-size:13px;">${HOSPITAL}</div>
        <div style="font-size:9px;">☎ ${TEL}</div>
      </div>
      <div style="text-align:right;">
        <div class="bold" style="font-size:16px;letter-spacing:2px;">ORDER SHEET</div>
        <div style="font-size:10px;margin-top:2px;">Visit No: <strong>${visitNo}</strong></div>
        <div style="font-size:10px;">Date: <strong>${visitDate}</strong></div>
        <div style="font-size:10px;">Clinic: <strong>${clinic}</strong></div>
      </div>
    </div>
  </div>

  <!-- ═══ PATIENT INFO ═══ -->
  <div style="border:1px solid #000;padding:5px 8px;margin-bottom:5px;">
    <div style="display:flex;gap:16px;flex-wrap:wrap;" class="row">
      <span>Name: <span class="line"><strong>${name}</strong></span></span>
      <span>Card No: <span class="line-s"><strong>${cardNo}</strong></span></span>
      <span>Age: <span class="line-s">${age}</span></span>
      <span>Sex: <span class="line-s">${sex}</span></span>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;" class="row">
      <span>Doctor: <span class="line">${doctorName}</span></span>
      <span>Ward/Bed: <span class="line-s">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></span>
    </div>
  </div>

  <!-- ═══ VITALS ═══ -->
  <div style="border:1px solid #000;padding:4px 8px;margin-bottom:5px;">
    <div style="font-size:9px;font-weight:bold;margin-bottom:3px;">VITAL SIGNS</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;">
      <div class="vital-box"><div style="font-size:8px;color:#555;">TEMP</div><div>${temp}</div></div>
      <div class="vital-box"><div style="font-size:8px;color:#555;">BP</div><div>${bp}</div></div>
      <div class="vital-box"><div style="font-size:8px;color:#555;">PULSE</div><div>${hr}</div></div>
      <div class="vital-box"><div style="font-size:8px;color:#555;">SpO₂</div><div>${spo2}</div></div>
      <div class="vital-box"><div style="font-size:8px;color:#555;">WEIGHT</div><div>${wt}</div></div>
      <div class="vital-box"><div style="font-size:8px;color:#555;">BMI</div><div>${bmi}</div></div>
    </div>
  </div>

  <!-- ═══ CLINICAL ═══ -->
  <div style="border:1px solid #000;padding:4px 8px;margin-bottom:5px;">
    <div class="row"><span class="sec">Chief Complaint:</span>
      &nbsp;<span class="line-l">${complaint}</span>
    </div>
    <div class="row"><span class="sec">Diagnosis:</span>
      &nbsp;<span class="line-l">${diagnosis} ${icdCode}</span>
    </div>
    ${treatment ? `<div class="row"><span class="sec">Treatment Plan:</span>
      &nbsp;<span class="line-l">${treatment}</span>
    </div>` : ''}
  </div>

  <!-- ═══ ORDER TABLE ═══ -->
  <table style="border:1px solid #000;font-size:10px;">
    <thead>
      <tr style="background:#e8e8e8;">
        <th style="border:1px solid #000;padding:3px 6px;width:13%;text-align:left;">Date</th>
        <th style="border:1px solid #000;padding:3px 6px;width:12%;text-align:left;">Time</th>
        <th style="border:1px solid #000;padding:3px 6px;width:60%;text-align:left;">Order</th>
        <th style="border:1px solid #000;padding:3px 6px;width:15%;text-align:left;">Signature</th>
      </tr>
    </thead>
    <tbody>
      <!-- DX row -->
      <tr>
        <td style="border:1px solid #000;padding:2px 6px;font-size:9px;">${visitDate}</td>
        <td style="border:1px solid #000;padding:2px 6px;font-size:9px;"></td>
        <td style="border:1px solid #000;padding:2px 6px;font-size:10px;">
          <strong>DX:</strong> ${diagnosis} ${icdCode}
        </td>
        <td style="border:1px solid #000;padding:2px 6px;font-size:9px;">${doctorName}</td>
      </tr>
      <!-- Condition row -->
      <tr>
        <td style="border:1px solid #000;padding:2px 6px;font-size:9px;"></td>
        <td style="border:1px solid #000;padding:2px 6px;"></td>
        <td style="border:1px solid #000;padding:2px 6px;font-size:10px;">
          <strong>Condition:</strong> ${visit.patientType || 'OPD'}
        </td>
        <td style="border:1px solid #000;padding:2px 6px;"></td>
      </tr>
      <!-- Vitals order row -->
      <tr>
        <td style="border:1px solid #000;padding:2px 6px;font-size:9px;"></td>
        <td style="border:1px solid #000;padding:2px 6px;"></td>
        <td style="border:1px solid #000;padding:2px 6px;font-size:10px;"><strong>Vital Signs:</strong> Monitor vitals</td>
        <td style="border:1px solid #000;padding:2px 6px;"></td>
      </tr>
      <!-- Lab orders -->
      ${labRows}
      <!-- Prescriptions -->
      ${rxRows}
      <!-- Blank rows -->
      ${blankRows}
    </tbody>
  </table>

  <!-- ═══ FOOTER ═══ -->
  <div style="border-top:1px solid #000;margin-top:6px;padding-top:4px;display:flex;justify-content:space-between;font-size:9px;color:#555;">
    <span>Generated: ${new Date().toLocaleString('en-GB')}</span>
    <span>Visit: ${visitNo} | Patient: ${cardNo}</span>
    <span>${HOSPITAL}</span>
  </div>

</div>
</body>
</html>`;

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
