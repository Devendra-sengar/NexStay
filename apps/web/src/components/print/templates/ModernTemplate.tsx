import React from "react";
interface PrintData { student: any; hostel: any; }
function fmtDate(d?: string | Date) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-IN"); }
function calcAge(d?: string | Date) { if (!d) return "—"; return String(Math.floor((Date.now() - new Date(d).getTime()) / (365.25*24*3600*1000))); }
const GENDER_LABEL: Record<string,string> = { BOYS:"Boys", GIRLS:"Girls", CO_ED:"Co-Ed" };
const STAY_LABEL: Record<string,string> = { "6_MONTHS":"6 Months", "12_MONTHS":"12 Months", OTHER:"Other" };

export default function ModernTemplate({ student, hostel }: PrintData) {
  const addr = hostel?.address;
  const fullAddr = [addr?.street, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(", ");
  const accentColor = "#1d4ed8";
  const lightAccent = "#eff6ff";
  return (
    <div style={{ width:"210mm", minHeight:"297mm", margin:"0 auto", background:"#fff", fontFamily:"'Segoe UI', Arial, sans-serif", boxSizing:"border-box", color:"#0f172a" }}>
      {/* Top accent bar */}
      <div style={{ height:8, background:`linear-gradient(90deg,${accentColor},#7c3aed)` }} />
      <div style={{ padding:"10mm 12mm" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {hostel?.printLogoUrl && (
              <img src={hostel.printLogoUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: 100, objectFit: "contain" }} />
            )}
            <div>
              <div style={{ fontSize:26, fontWeight:800, color:accentColor, letterSpacing:-0.5, lineHeight:1 }}>{student?.propertyId?.name || hostel?.name || "Hostel Name"}</div>
              <div style={{ fontSize:9, color:"#64748b", marginTop:4, lineHeight:1.7 }}>
                {fullAddr && <div>{fullAddr}</div>}
                {hostel?.contactPhone && <div>📞 {hostel.contactPhone}</div>}
              </div>
            </div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:70, height:85, border:`2px solid ${accentColor}`, borderRadius:6, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", background:lightAccent, color:"#94a3b8", fontSize:10 }}>
              {student?.photoUrl ? <img src={student.photoUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "Photo"}
            </div>
            <div style={{ marginTop:6, background:accentColor, color:"#fff", borderRadius:4, padding:"2px 10px", fontSize:9, fontWeight:700 }}>{GENDER_LABEL[hostel?.gender] ?? "Co-Ed"}</div>
          </div>
        </div>
        {/* Title banner */}
        <div style={{ background:accentColor, color:"#fff", padding:"8px 16px", borderRadius:6, marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:800, fontSize:13, letterSpacing:1 }}>REGISTRATION FORM</span>
          <span style={{ fontSize:10 }}>Date: {(student?.registrationDate || student?.admissionDate) ? fmtDate(student.registrationDate || student.admissionDate) : "____________"}</span>
        </div>
        {/* Grid fields */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 16px", fontSize:10 }}>
          <GF label="Name of Tenant" value={student?.name} full />
          <GF label="Father's Name" value={student?.fatherName} full />
          <GF label="Father's Occupation" value={student?.fatherOccupation} />
          <GF label="Father's Contact" value={student?.fatherContact} />
          <GF label="Mother's Name" value={student?.motherName} full />
          <GF label="Date of Birth" value={fmtDate(student?.dateOfBirth)} />
          <GF label="Age / Blood Group" value={`${calcAge(student?.dateOfBirth)} / ${student?.bloodGroup || "—"}`} />
          <GF label="Aadhaar Card No." value={student?.aadhaarNumber} full />
          <GF label="Marital Status" value={student?.maritalStatus} />
          <GF label="Education" value={student?.education} />
          <GF label="Email Address" value={student?.email} full />
          <GF label="Occupation" value={student?.occupation} />
          <GF label="Organization" value={student?.organization} />
          <GF label="Mobile No." value={student?.phone} full />
          <GF label="Permanent Address" value={student?.permanentAddress} full />
          <GF label="Guardian Name" value={student?.guardianName} />
          <GF label="Guardian Mobile" value={student?.guardianPhone} />
          <GF label="Guardian Address" value={student?.guardianAddress} full />
          <GF label="Vehicle No." value={student?.vehicleNumber} />
          <GF label="Admission Date" value={fmtDate(student?.admissionDate)} />
          <GF label="Medical History" value={student?.medicalHistory} full />
        </div>
        {/* Lock-in Period */}
        <div style={{ marginTop:16, padding:"10px 14px", background:lightAccent, borderRadius:6, border:`1px solid ${accentColor}20` }}>
          <span style={{ fontWeight:700, fontSize:10, color:accentColor, marginRight:16 }}>Lock-in Period</span>
          {[["6","6 Months"],["12","12 Months"],["OTHER","Other"]].map(([val,lbl]) => {
            const sp = String(student?.stayingPeriod || "");
            const isMatch = val === "OTHER" ? (sp && sp !== "6" && sp !== "12") : sp === val;
            return (
              <label key={val} style={{ display:"inline-flex", alignItems:"center", gap:5, marginRight:16, fontSize:10, cursor:"default" }}>
                <span style={{ width:14, height:14, borderRadius:3, border:`2px solid ${accentColor}`, background:isMatch?accentColor:"transparent", display:"inline-block", flexShrink:0 }} />
                {lbl} {val === "OTHER" && isMatch ? `(${sp} Months)` : ""}
              </label>
            );
          })}
        </div>
        {/* Signatures */}
        <div style={{ marginTop:32, display:"flex", justifyContent:"space-between", fontSize:10 }}>
          <div style={{ textAlign:"center", minWidth:150 }}><div style={{ borderBottom:`2px solid ${accentColor}`, marginBottom:8 }} /><span style={{ color:accentColor, fontWeight:700 }}>Owner Signature</span></div>
          <div style={{ textAlign:"center", minWidth:150 }}><div style={{ borderBottom:`2px solid ${accentColor}`, marginBottom:8 }} /><span style={{ color:accentColor, fontWeight:700 }}>Applicant Signature</span></div>
        </div>
      </div>
      {/* Bottom bar */}
      <div style={{ height:4, background:`linear-gradient(90deg,${accentColor},#7c3aed)`, marginTop:"auto" }} />
    </div>
  );
}

function GF({ label, value, full }: { label:string; value?:string; full?:boolean }) {
  const style: React.CSSProperties = full ? { gridColumn:"1/-1" } : {};
  return (
    <div style={style}>
      <div style={{ fontSize:8, color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 }}>{label}</div>
      <div style={{ borderBottom:"1.5px solid #e2e8f0", paddingBottom:4, fontSize:10, color:value?"#0f172a":"#cbd5e1", minHeight:18 }}>{value || "—"}</div>
    </div>
  );
}
