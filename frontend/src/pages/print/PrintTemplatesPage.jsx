import React, { useRef } from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';

// ── Print helper ──────────────────────────────────────────────────
function printForm(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const w = window.open('', '_blank', 'width=800,height=1100');
  w.document.write(`
    <html><head><title>Print</title>
    <style>
      @page { size: A4; margin: 10mm; }
      body { font-family: 'Times New Roman', serif; font-size: 11px; margin: 0; padding: 0; }
      * { box-sizing: border-box; }
      .print-root { padding: 10px; }
      table { width: 100%; border-collapse: collapse; }
      td, th { padding: 2px 4px; }
      .border-b { border-bottom: 1px solid #000; }
      .dashed { border-bottom: 1px dashed #000; }
      .solid  { border-bottom: 1.5px solid #000; }
      .text-center { text-align: center; }
      .text-right  { text-align: right; }
      .font-bold   { font-weight: bold; }
      .text-lg     { font-size: 14px; }
      .text-xl     { font-size: 16px; }
      .text-xs     { font-size: 9px; }
      .mt1 { margin-top: 4px; }
      .mt2 { margin-top: 8px; }
      .mt3 { margin-top: 14px; }
      .mt4 { margin-top: 20px; }
      .flex { display: flex; }
      .gap { gap: 8px; }
      .w-half { width: 50%; }
      .w-full { width: 100%; }
      hr { border: none; border-top: 1px solid #000; margin: 4px 0; }
      .line { display: inline-block; border-bottom: 1px solid #000; min-width: 120px; }
      .line-long { display: inline-block; border-bottom: 1px solid #000; min-width: 200px; }
      .line-short { display: inline-block; border-bottom: 1px solid #000; min-width: 60px; }
    </style>
    </head><body><div class="print-root">${el.innerHTML}</div></body></html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 400);
}

// ── Shared form header ────────────────────────────────────────────
const HOSPITAL = 'YOHANNES FANTAYE METASEBIYA GENERAL HOSPITAL PLC';
const TEL      = '0221160106 / 022110868';
const AMHARIC  = 'ዮሃንስ ፈንታዬ መታሰቢያ አጠቃላይ ሆስፒታል ኃ/የተ/የግ/ማህበር';

export default function PrintTemplatesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Print Templates</h1>
          <p className="page-subtitle">Official hospital document forms — click Print to open print dialog</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FormCard id="form-prescription"  title="Prescription Paper"              onPrint={() => printForm('form-prescription')}><PrescriptionForm /></FormCard>
        <FormCard id="form-xray"          title="X-Ray & Sonography Form"         onPrint={() => printForm('form-xray')}><XRayForm /></FormCard>
        <FormCard id="form-referral"      title="Referral Slip"                   onPrint={() => printForm('form-referral')}><ReferralForm /></FormCard>
        <FormCard id="form-ordersheet"    title="Order Sheet"                     onPrint={() => printForm('form-ordersheet')}><OrderSheetForm /></FormCard>
        <FormCard id="form-lab"           title="Laboratory Reporting Form"       onPrint={() => printForm('form-lab')}><LabReportForm /></FormCard>
        <FormCard id="form-medcert"       title="Medical Certificate (OPD)"       onPrint={() => printForm('form-medcert')}><MedicalCertificateForm /></FormCard>
      </div>
    </div>
  );
}

function FormCard({ id, title, onPrint, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button onClick={onPrint} className="btn-primary py-1.5 px-3 text-sm">
          <PrinterIcon className="w-4 h-4" /> Print
        </button>
      </div>
      <div className="overflow-auto bg-white" style={{ maxHeight: '480px' }}>
        <div id={id} className="p-4" style={{ fontFamily: 'Times New Roman, serif', fontSize: '11px', color: '#000', minWidth: '520px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 1. PRESCRIPTION PAPER
// ══════════════════════════════════════════════════════════════════
function PrescriptionForm() {
  const Line = ({ w = 160 }) => <span style={{ display:'inline-block', borderBottom:'1px solid #000', minWidth: w, marginBottom:'-3px' }}>&nbsp;</span>;
  return (
    <div style={{ border: '1px solid #000', padding: '12px', minHeight: '680px' }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '6px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>PRESCRIPTION PAPER</div>
        <div>Institution Name :- <strong>{HOSPITAL}</strong></div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span>Tel. No. {TEL}</span>
          <span>Date --------------------------------</span>
        </div>
      </div>

      {/* Patient info */}
      <div style={{ marginBottom: '4px' }}>Patient's Full Name: <Line w={220} /></div>
      <div style={{ display:'flex', gap: '12px', marginBottom: '4px' }}>
        <span>Sex: <Line w={40} /></span>
        <span>Age: <Line w={40} /></span>
        <span>Weight: <Line w={50} /></span>
        <span>Card No. <Line w={80} /></span>
      </div>
      <div style={{ display:'flex', gap: '12px', marginBottom: '4px' }}>
        <span>Region: <Line w={60} /></span>
        <span>Town: <Line w={60} /></span>
        <span>Woreda: <Line w={50} /></span>
        <span>Kebele: <Line w={40} /></span>
      </div>
      <div style={{ display:'flex', gap: '24px', marginBottom: '8px' }}>
        <span>☐ Inpatient</span>
        <span>☐ Out Patient</span>
      </div>

      {/* Dx */}
      <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }}>
        Dx.---------------------------------------------------------------------------------------------
      </div>

      {/* Rx */}
      <div style={{ fontSize: '20px', fontStyle: 'italic', marginBottom: '6px' }}>℞</div>
      {/* Space for prescription */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} style={{ borderBottom: '1px dashed #aaa', marginBottom: '10px', height: '16px' }} />
      ))}

      {/* Footer signatures */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop: '20px', borderTop: '1px solid #000', paddingTop: '8px' }}>
        <div style={{ width: '45%' }}>
          <div style={{ fontWeight: 'bold' }}>Prescriber's</div>
          <div>Full Name .........................................</div>
          <div>Qualification ...................................</div>
          <div>Registration # ..................................</div>
          <div>Signature .......................................</div>
          <div>Date .............................................</div>
        </div>
        <div style={{ width: '45%' }}>
          <div style={{ fontWeight: 'bold' }}>Dispenser's</div>
          <div>Full Name .........................................</div>
          <div>Qualification ...................................</div>
          <div>Registration # ..................................</div>
          <div>Signature .......................................</div>
          <div>Date .............................................</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 2. X-RAY & SONOGRAPHY REQUEST AND REPORT FORM
// ══════════════════════════════════════════════════════════════════
function XRayForm() {
  const Line = ({ w = 160 }) => <span style={{ display:'inline-block', borderBottom:'1px solid #000', minWidth: w, marginBottom:'-3px' }}>&nbsp;</span>;
  return (
    <div style={{ border: '1px solid #000', padding: '12px', minHeight: '680px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '10px' }}>
        <div style={{ fontSize: '13px' }}>{AMHARIC}</div>
        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{HOSPITAL}</div>
        <div style={{ fontSize: '10px' }}>info@yfmhospital.com | {TEL}</div>
        <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px', letterSpacing: '1px' }}>
          X-RAY &amp; SONOGRAPHY REQUEST AND REPORT FORM
        </div>
      </div>

      {/* Patient info */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'6px' }}>
        <span>Name <Line w={160} /></span>
        <span>Address <Line w={100} /></span>
      </div>
      <div style={{ display:'flex', gap:'12px', marginBottom:'6px' }}>
        <span>Patient's Name <Line w={120} /></span>
        <span>Age <Line w={40} /></span>
        <span>Sex <Line w={40} /></span>
        <span>Card No— <Line w={60} /></span>
      </div>
      <div style={{ display:'flex', gap:'12px', marginBottom:'12px' }}>
        <span>Appointment <Line w={80} /></span>
      </div>

      {/* C/C */}
      <div style={{ marginBottom: '6px' }}>C/C <Line w={360} /></div>

      {/* Request */}
      <div style={{ marginBottom: '6px' }}>Request <Line w={340} /></div>
      <div style={{ borderBottom: '1px dashed #ccc', marginBottom: '6px' }}><Line w={400} /></div>

      {/* Finding */}
      <div style={{ marginBottom: '6px' }}>Finding <Line w={350} /></div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ borderBottom: '1px dashed #aaa', marginBottom: '10px', height: '14px' }} />
      ))}

      {/* Report */}
      <div style={{ marginBottom: '6px' }}>Report: <Line w={340} /></div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ borderBottom: '1px dashed #aaa', marginBottom: '10px', height: '14px' }} />
      ))}

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'20px', borderTop:'1px solid #000', paddingTop:'8px' }}>
        <div>
          <div>QUEST BY: ................................................</div>
          <div style={{ marginTop:'4px' }}>REPORTED BY: ............................................</div>
          <div style={{ marginTop:'4px' }}>SIGNATURE ................................................</div>
          <div style={{ marginTop:'4px' }}>DATE .......................................................</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 3. REFERRAL SLIP
// ══════════════════════════════════════════════════════════════════
function ReferralForm() {
  const DashedLine = ({ w = '100%' }) => (
    <span style={{ display:'inline-block', borderBottom:'1px dashed #000', width: w, marginBottom:'-3px' }}>&nbsp;</span>
  );
  const FullLine = () => (
    <div style={{ borderBottom:'1px dashed #000', marginBottom:'8px', marginTop:'2px', height:'16px' }} />
  );
  return (
    <div style={{ border:'1px solid #000', padding:'14px', minHeight:'680px' }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:'8px' }}>
        <div style={{ fontSize:'12px' }}>{AMHARIC}</div>
        <div style={{ fontSize:'10px' }}>ኃ/የተ/የግ/ማህበር</div>
        <div style={{ fontWeight:'bold', fontSize:'12px' }}>{HOSPITAL}</div>
        <div style={{ fontSize:'10px' }}>☎ {TEL}</div>
        <div style={{ fontSize:'10px' }}>✉ 17</div>
        <div style={{ fontSize:'10px' }}>ምዴ modjo</div>
        <div style={{ fontWeight:'bold', fontSize:'18px', letterSpacing:'2px', marginTop:'6px', marginBottom:'6px' }}>
          REFERRAL SLIP
        </div>
      </div>

      {/* Patient details */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'4px' }}>
        <span style={{ width:'50%' }}>Name ——<DashedLine w="120px" /></span>
        <span style={{ width:'50%' }}>Address ——<DashedLine w="100px" /></span>
      </div>
      <div style={{ marginBottom:'4px' }}>Age ——<DashedLine w="160px" />&nbsp;&nbsp;&nbsp;Date ——<DashedLine w="100px" /></div>

      {/* Sections */}
      {[
        { label: 'C/c', lines: 3 },
        { label: 'P/E', lines: 4 },
        { label: 'Lab', lines: 2 },
        { label: 'Dx',  lines: 2 },
        { label: 'Rx',  lines: 2 },
        { label: 'Reason', lines: 2 },
      ].map(sec => (
        <div key={sec.label} style={{ marginTop: '6px' }}>
          <div style={{ marginBottom:'2px' }}><strong>{sec.label}</strong> ——<DashedLine w="340px" /></div>
          {Array.from({ length: sec.lines - 1 }).map((_, i) => <FullLine key={i} />)}
        </div>
      ))}

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'16px', borderTop:'1px solid #000', paddingTop:'8px' }}>
        <span>Physician Name ——<DashedLine w="140px" /></span>
        <span>Sign ——<DashedLine w="100px" /></span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 4. ORDER SHEET
// ══════════════════════════════════════════════════════════════════
function OrderSheetForm() {
  const dots = (n = 30) => '.'.repeat(n);
  const rows = Array.from({ length: 22 });
  return (
    <div style={{ border:'1px solid #000', padding:'12px', minHeight:'680px' }}>
      {/* Header */}
      <div style={{ textAlign:'center', borderBottom:'2px solid #000', paddingBottom:'6px', marginBottom:'8px' }}>
        <div style={{ fontSize:'12px' }}>{AMHARIC}</div>
        <div style={{ fontWeight:'bold', fontSize:'12px' }}>{HOSPITAL}</div>
        <div style={{ fontWeight:'bold', fontSize:'16px', letterSpacing:'3px', marginTop:'4px' }}>ORDER SHEET</div>
      </div>

      {/* Patient info */}
      <div style={{ marginBottom:'6px' }}>
        Name of Patient{dots(38)}Sex{dots(6)}Age{dots(6)}
      </div>
      <div style={{ marginBottom:'10px' }}>
        Ward &amp; bed No {dots(34)}Card Number{dots(14)}
      </div>

      {/* Table */}
      <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #000', fontSize:'10px' }}>
        <thead>
          <tr>
            <th style={{ border:'1px solid #000', padding:'3px 6px', width:'14%', textAlign:'left' }}>Date</th>
            <th style={{ border:'1px solid #000', padding:'3px 6px', width:'14%', textAlign:'left' }}>Time</th>
            <th style={{ border:'1px solid #000', padding:'3px 6px', width:'58%', textAlign:'left' }}>Order</th>
            <th style={{ border:'1px solid #000', padding:'3px 6px', width:'14%', textAlign:'left' }}>Signature</th>
          </tr>
        </thead>
        <tbody>
          {/* First few rows have labels */}
          {['DX :', '', '', 'Condition :', 'Activity', 'Vital Sign', 'Diet', 'Nursing care', 'Investigation', '', 'Treatment', ...Array.from({ length: 11 }).map(() => '')].map((label, i) => (
            <tr key={i}>
              <td style={{ border:'1px solid #000', padding:'2px 4px', height:'22px' }}>&nbsp;</td>
              <td style={{ border:'1px solid #000', padding:'2px 4px' }}>&nbsp;</td>
              <td style={{ border:'1px solid #000', padding:'2px 4px' }}>{label}&nbsp;</td>
              <td style={{ border:'1px solid #000', padding:'2px 4px' }}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 5. LABORATORY REPORTING FORM
// ══════════════════════════════════════════════════════════════════
function LabReportForm() {
  const Line = ({ w = 80 }) => <span style={{ display:'inline-block', borderBottom:'1px solid #000', minWidth: w, marginBottom:'-3px' }}>&nbsp;</span>;

  const Cell = ({ children, style = {} }) => (
    <td style={{ border:'1px solid #000', padding:'1px 3px', fontSize:'9px', verticalAlign:'top', ...style }}>{children}</td>
  );

  const tests = {
    HEMATOLOGY: ['CBC', 'WBC', 'Diff N....%  L....%', 'B....%  M....%', 'Hgb', 'Hct', 'ESR', 'Platelets', 'Blood group &Rh', 'Hgb Alc', 'Blood Film/Malaria', 'peripheral Morphology'],
    'STOOL TEST': ['O/P', 'H.Pylori (Stool)', 'Concentration', 'Consistency', 'Occult Blood'],
    URINALYSIS: ['Color', 'Appearance', 'PH', 'SG', 'protein', 'Glucose', 'Ketones', 'Bilirubin', 'Urobilinogen', 'Blood', 'Leukocyte', 'Nitrate'],
    MICROSCOPY: ['Epit cells', 'WBC', 'RBC', 'Casts', 'Crystals', 'Bacteria'],
    SEROLOGY: ['VDRL/RPR', 'WIDAL/H/Typhoid', 'O', 'HBsAg', 'HCV Ab', 'ASO', 'CRP', 'Rheumatoid Factor', 'PHCT(HIV)', 'HP color (Serum)'],
    BACTERIOLOGY: ['Sample', 'KOH', 'Gram Stain', 'Wet Film', 'AFB', 'Culture'],
    CHEMISTRY: ['FBS/RBS', 'SGOT', 'SGPT', 'Alkaline Phosphates', 'Bilirubin (Total)', 'Bilirubin (Direct)', 'Urea', 'Creatinine', 'Uric Acid', 'Total Protein'],
    'Lipid Profile': ['Cholesterol Total', 'Tri glycerol Total', 'HDL-C', 'LDL-C', 'LDH'],
    ELECTROLYTES: ['Sodium (Na)', 'Potassium (K)', 'Calcium (Ca)', 'Cancer Marker', 'Vitamin D'],
    'HCOG Test': ['T3', 'T4', 'TSH'],
    COAGULATION: ['PT', 'PTT', 'INR'],
  };

  const normalValues = {
    T3: '1.3 – 46 u/l', T4: '10 – 56 u/l', TSH: '45 – 150 u/l',
    PT: '0.3 – 1.9 mg/dl', PTT: '0.0 – 0.3 mg/dl', INR: '15 – 40 mg/dl',
    'FBS/RBS': '70 – 140 mg/dl',
    'Cholesterol Total': '<150 mg/dl', 'Tri glycerol Total': '<200 mg/dl',
    'HDL-C': '>55 mg/dl', 'LDL-C': '<220 mg/dl', 'LDH': '56 194 u/l',
    'Sodium (Na)': '3.5–5.5 mEq/l', 'Potassium (K)': '136-146 mmol/l',
    'Calcium (Ca)': '8.4–10.2 mg/dl',
    Creatinine: '0.70 – 1.20 mg/dl', 'Uric Acid': '2.2-7.2 mg/dl',
    'Total Protein': '6.6 – 8.9 mg/dl',
    'Bilirubin (Total)': '0.3 – 1.9 mg/dl', 'Bilirubin (Direct)': '0.0 – 0.3 mg/dl',
    Urea: '15 – 40 mg/dl', 'Alkaline Phosphates': '45 – 150 u/l',
    SGOT: '13 – 46 u/l', SGPT: '10 – 56 u/l',
  };

  return (
    <div style={{ border:'1px solid #000', padding:'8px', fontSize:'9px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'2px solid #000', paddingBottom:'4px', marginBottom:'6px' }}>
        <div>
          <div style={{ fontSize:'10px' }}>{AMHARIC}</div>
          <div style={{ fontWeight:'bold', fontSize:'10px' }}>{HOSPITAL}</div>
          <div>☎ {TEL}</div>
          <div style={{ fontWeight:'bold', marginTop:'2px' }}>LABORATORY REPORTING</div>
        </div>
        <div style={{ textAlign:'right', fontSize:'9px' }}>
          <div>info@yfmhospital.com</div>
          <div>{TEL}</div>
        </div>
      </div>

      {/* Patient row */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
        <span>Name <Line w={100} /></span>
        <span>Sex <Line w={40} /></span>
        <span>Age <Line w={40} /></span>
        <span>Card No <Line w={60} /></span>
        <span>Address <Line w={80} /></span>
      </div>
      <div style={{ display:'flex', gap:'8px', marginBottom:'6px' }}>
        <span>Appointment <Line w={80} /></span>
      </div>

      {/* Tests table — 3 column layout */}
      <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #000' }}>
        <thead>
          <tr>
            <Cell style={{ fontWeight:'bold', width:'34%' }}>TEST</Cell>
            <Cell style={{ fontWeight:'bold', width:'22%' }}>RESULT</Cell>
            <Cell style={{ fontWeight:'bold', width:'22%' }}>NORMAL VALUE</Cell>
            <Cell style={{ fontWeight:'bold', width:'22%' }}>SAMPLE</Cell>
          </tr>
        </thead>
        <tbody>
          {Object.entries(tests).map(([category, items]) => [
            <tr key={`cat-${category}`}>
              <td colSpan={4} style={{ border:'1px solid #000', padding:'1px 3px', fontWeight:'bold', backgroundColor:'#f0f0f0', fontSize:'9px' }}>
                {category}
              </td>
            </tr>,
            ...items.map(item => (
              <tr key={item}>
                <Cell>☐ {item}</Cell>
                <Cell>&nbsp;</Cell>
                <Cell style={{ fontSize:'8px' }}>{normalValues[item] || ''}</Cell>
                <Cell>&nbsp;</Cell>
              </tr>
            )),
          ])}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 6. MEDICAL CERTIFICATE (OPD)
// ══════════════════════════════════════════════════════════════════
function MedicalCertificateForm() {
  const Line = ({ w = 160 }) => (
    <span style={{ display:'inline-block', borderBottom:'1px solid #000', minWidth: w, marginBottom:'-3px' }}>&nbsp;</span>
  );
  const DottedLine = ({ n = 30 }) => '.'.repeat(n);

  return (
    <div style={{ border:'1px solid #000', padding:'16px', minHeight:'680px', fontFamily:'Times New Roman, serif' }}>

      {/* Header */}
      <div style={{ textAlign:'center', borderBottom:'2px solid #000', paddingBottom:'8px', marginBottom:'12px' }}>
        <div style={{ fontSize:'13px', marginBottom:'2px' }}>{AMHARIC}</div>
        <div style={{ fontSize:'11px', marginBottom:'2px' }}>ኃ/የተ/የግ/ማህበር</div>
        <div style={{ fontWeight:'bold', fontSize:'13px', marginBottom:'2px' }}>{HOSPITAL}</div>
        <div style={{ fontSize:'10px', marginBottom:'4px' }}>☎ {TEL}</div>
        <div style={{ fontWeight:'bold', fontSize:'16px', letterSpacing:'3px', textDecoration:'underline' }}>
          MEDICAL CERTIFICATE
        </div>
      </div>

      {/* Date & Reference */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
        <span>Date: <Line w={120} /></span>
        <span>Ref No: <Line w={100} /></span>
      </div>

      {/* To whom */}
      <div style={{ marginBottom:'10px' }}>
        To Whom It May Concern,
      </div>

      {/* Body text */}
      <div style={{ marginBottom:'10px', lineHeight:'2.0' }}>
        This is to certify that <Line w={200} /> (Full Name), Age <Line w={50} />, Sex <Line w={40} />,
        Card No. <Line w={80} />, has been examined at this institution on <Line w={120} /> and found to be
        suffering from:
      </div>

      {/* Diagnosis */}
      <div style={{ marginBottom:'4px', marginTop:'8px' }}>
        <strong>Diagnosis:</strong>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ borderBottom:'1px solid #000', marginBottom:'8px', height:'18px' }} />
      ))}

      {/* Condition */}
      <div style={{ marginBottom:'10px', lineHeight:'2.0' }}>
        The patient <strong>☐ requires rest</strong> &nbsp;&nbsp; <strong>☐ is fit for work</strong> &nbsp;&nbsp; <strong>☐ needs hospitalization</strong>
      </div>

      {/* Rest days */}
      <div style={{ marginBottom:'10px', lineHeight:'2.0' }}>
        Recommended rest period: <Line w={60} /> day(s), from <Line w={100} /> to <Line w={100} />
      </div>

      {/* Treatment */}
      <div style={{ marginBottom:'4px' }}>
        <strong>Treatment given:</strong>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ borderBottom:'1px dashed #000', marginBottom:'8px', height:'16px' }} />
      ))}

      {/* Remarks */}
      <div style={{ marginBottom:'4px', marginTop:'4px' }}>
        <strong>Remarks:</strong>
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} style={{ borderBottom:'1px dashed #000', marginBottom:'8px', height:'16px' }} />
      ))}

      {/* Spacer */}
      <div style={{ marginTop:'20px' }} />

      {/* Signatures */}
      <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #000', paddingTop:'12px', marginTop:'16px' }}>
        <div style={{ width:'44%' }}>
          <div><strong>Physician's</strong></div>
          <div style={{ marginTop:'6px' }}>Full Name: <DottedLine n={22} /></div>
          <div style={{ marginTop:'4px' }}>Qualification: <DottedLine n={18} /></div>
          <div style={{ marginTop:'4px' }}>License No: <DottedLine n={20} /></div>
          <div style={{ marginTop:'4px' }}>Signature: <DottedLine n={21} /></div>
          <div style={{ marginTop:'4px' }}>Date: <DottedLine n={26} /></div>
        </div>

        <div style={{ width:'44%', textAlign:'center' }}>
          <div style={{ border:'1px solid #000', height:'80px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'6px' }}>
            <span style={{ fontSize:'9px', color:'#666' }}>Official Stamp</span>
          </div>
          <div style={{ fontSize:'9px' }}>Hospital Stamp</div>
        </div>
      </div>

      {/* Footer note */}
      <div style={{ marginTop:'16px', borderTop:'1px dashed #000', paddingTop:'6px', fontSize:'9px', color:'#555' }}>
        This certificate is issued for official use only. Any alteration renders it invalid.
      </div>

    </div>
  );
}
