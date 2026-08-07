import React from "react";
interface PrintData { student: any; hostel: any; }
function fmtDate(d?: string | Date) { if (!d) return ""; return new Date(d).toLocaleDateString("en-IN"); }
function calcAge(d?: string | Date) { if (!d) return ""; return String(Math.floor((Date.now() - new Date(d).getTime()) / (365.25*24*3600*1000))); }
const GL: Record<string,string> = { BOYS:"Boys", GIRLS:"Girls", CO_ED:"Co-Ed" };

export default function ElegantTemplate({ student, hostel }: PrintData) {
  const addr = hostel?.address;
  const fullAddr = [addr?.street, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(", ");
  const gold = "#b8860b";
  const darkGold = "#7d5a0a";

  return (
    <div style={{ width:"210mm", minHeight:"297mm", margin:"0 auto", background:"#fffdf7", fontFamily:"Georgia, serif", padding:"10mm", boxSizing:"border-box", color:"#2c1a00", position:"relative" }}>
      {/* Outer ornamental border */}
      <div style={{ position:"absolute", inset:"5mm", border:`2.5px solid ${gold}`, pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:"7mm", border:`0.5px solid ${gold}`, pointerEvents:"none" }} />
      {/* Corner diamonds */}
      {[{ top:"3.5mm", left:"3.5mm" },{ top:"3.5mm", right:"3.5mm" },{ bottom:"3.5mm", left:"3.5mm" },{ bottom:"3.5mm", right:"3.5mm" }].map((s,i)=>(
        <div key={i} style={{ position:"absolute", ...s, width:10, height:10, background:gold, transform:"rotate(45deg)" }} />
      ))}
      <div style={{ padding:"10mm 12mm", position:"relative" }}>
        {/* Decorative top line */}
        <div style={{ textAlign:"center", marginBottom:12 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:1, background:gold }} />
            <div style={{ width:6, height:6, background:gold, transform:"rotate(45deg)" }} />
            <div style={{ width:40, height:1, background:gold }} />
          </div>
        </div>
        {/* Title */}
        <div style={{ textAlign:"center", marginBottom:10 }}>
          <div style={{ fontSize:11, letterSpacing:5, fontWeight:700, color:gold, textTransform:"uppercase" }}>Registration Form</div>
        </div>
        {/* Hostel name */}
        <div style={{ textAlign:"center", marginBottom:8 }}>
          {hostel?.printLogoUrl && (
            <img src={hostel.printLogoUrl} alt="Logo" style={{ maxHeight: 70, maxWidth: 120, objectFit: "contain", marginBottom: 8 }} />
          )}
          <div style={{ fontSize:24, fontWeight:700, color:darkGold, letterSpacing:1 }}>{student?.propertyId?.name || hostel?.name || "Hostel Name"}</div>
          <div style={{ fontSize:9, color:"#7a5c3a", marginTop:4, lineHeight:1.7 }}>
            {fullAddr && <div>{fullAddr}</div>}
            {hostel?.contactPhone && <div>Contact: {hostel.contactPhone}</div>}
          </div>
        </div>
        {/* Gold divider */}
        <div style={{ textAlign:"center", marginBottom:12 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
            <div style={{ width:60, height:1, background:gold }} />
            <div style={{ fontSize:16, color:gold }}>❧</div>
            <div style={{ width:60, height:1, background:gold }} />
          </div>
        </div>
        {/* Photo + gender + date row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div style={{ fontSize:10, color:"#7a5c3a" }}>
            Date: <span style={{ borderBottom:`1px solid ${gold}`, display:"inline-block", minWidth:80 }}>{fmtDate(student?.registrationDate || student?.admissionDate)}</span>
            <span style={{ marginLeft:16 }}>Gender: <strong>{GL[hostel?.gender]}</strong></span>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:64, height:78, border:`2px solid ${gold}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#c9a96e", overflow:"hidden", background:"#fdf8ee" }}>
              {student?.photoUrl ? <img src={student.photoUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "Photograph"}
            </div>
          </div>
        </div>
        {/* Fields */}
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
          <tbody>
            <ERow label="Name of Tenant" value={student?.name} gold={gold} />
            <ERow label="Father's Name" value={student?.fatherName} gold={gold} />
            <ERowDuo label1="Father's Occupation" value1={student?.fatherOccupation} label2="Contact" value2={student?.fatherContact} gold={gold} />
            <ERow label="Mother's Name" value={student?.motherName} gold={gold} />
            <ERowDuo label1="Date of Birth" value1={fmtDate(student?.dateOfBirth)} label2={`Age: ${calcAge(student?.dateOfBirth)}  |  Blood Group`} value2={student?.bloodGroup} gold={gold} />
            <ERow label="Aadhaar Card No." value={student?.aadhaarNumber} gold={gold} />
            <ERowDuo label1="Marital Status" value1={student?.maritalStatus} label2="Education" value2={student?.education} gold={gold} />
            <ERow label="Email Address" value={student?.email} gold={gold} />
            <ERowDuo label1="Occupation" value1={student?.occupation} label2="Organization" value2={student?.organization} gold={gold} />
            <ERow label="Mobile No." value={student?.phone} gold={gold} />
            <ERow label="Permanent Address" value={student?.permanentAddress} gold={gold} />
            <ERow label="Guardian Name & Address" value={[student?.guardianName, student?.guardianAddress].filter(Boolean).join(", ")} gold={gold} />
            <ERow label="Guardian Mobile" value={student?.guardianPhone} gold={gold} />
            <ERowDuo label1="Vehicle No." value1={student?.vehicleNumber} label2="Date of Admission" value2={fmtDate(student?.admissionDate)} gold={gold} />
            <ERow label="Medical History (If Any Disease)" value={student?.medicalHistory} gold={gold} />
          </tbody>
        </table>
        {/* Lock-in */}
        <div style={{ marginTop:14, padding:"8px 12px", border:`1px solid ${gold}50`, background:"#fdf3dc", fontSize:10, display:"flex", alignItems:"center", gap:20 }}>
          <span style={{ fontWeight:700, color:darkGold }}>Lock-in Period</span>
          {[["6_MONTHS","6 Months"],["12_MONTHS","12 Months"],["OTHER","Other"]].map(([val,lbl]) => (
            <label key={val} style={{ display:"flex", alignItems:"center", gap:5, cursor:"default" }}>
              <span style={{ width:12, height:12, border:`1.5px solid ${gold}`, display:"inline-block", background:student?.stayingPeriod===val?gold:"transparent", flexShrink:0 }} />{lbl}
            </label>
          ))}
        </div>
        {/* Divider */}
        <div style={{ textAlign:"center", margin:"20px 0 16px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
            <div style={{ width:50, height:1, background:gold }} />
            <div style={{ width:5, height:5, background:gold, borderRadius:"50%" }} />
            <div style={{ width:50, height:1, background:gold }} />
          </div>
        </div>
        {/* Signatures */}
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10 }}>
          <div style={{ textAlign:"center", minWidth:140 }}>
            <div style={{ borderBottom:`1.5px solid ${gold}`, marginBottom:6 }} />
            <span style={{ color:darkGold, fontWeight:700 }}>Signature of Owner</span>
          </div>
          <div style={{ textAlign:"center", minWidth:140 }}>
            <div style={{ borderBottom:`1.5px solid ${gold}`, marginBottom:6 }} />
            <span style={{ color:darkGold, fontWeight:700 }}>Applicant Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ERow({ label, value, gold }: { label:string; value?:string; gold:string }) {
  return (
    <tr>
      <td colSpan={3} style={{ padding:"5px 0", borderBottom:"1px solid #e8d5a0" }}>
        <span style={{ fontWeight:700, color:"#5a3e0a", marginRight:6, whiteSpace:"nowrap" }}>{label}:</span>
        <span style={{ color:value?"#2c1a00":"#c9a96e" }}>{value || "................................."}</span>
      </td>
    </tr>
  );
}

function ERowDuo({ label1, value1, label2, value2, gold }: { label1:string; value1?:string; label2:string; value2?:string; gold:string }) {
  return (
    <tr>
      <td style={{ padding:"5px 8px 5px 0", borderBottom:"1px solid #e8d5a0", width:"50%" }}>
        <span style={{ fontWeight:700, color:"#5a3e0a", marginRight:4, whiteSpace:"nowrap" }}>{label1}:</span>
        <span style={{ color:value1?"#2c1a00":"#c9a96e" }}>{value1 || "—"}</span>
      </td>
      <td style={{ padding:"5px 0", borderBottom:"1px solid #e8d5a0", width:"50%", paddingLeft:12 }}>
        <span style={{ fontWeight:700, color:"#5a3e0a", marginRight:4, whiteSpace:"nowrap" }}>{label2}:</span>
        <span style={{ color:value2?"#2c1a00":"#c9a96e" }}>{value2 || "—"}</span>
      </td>
    </tr>
  );
}
