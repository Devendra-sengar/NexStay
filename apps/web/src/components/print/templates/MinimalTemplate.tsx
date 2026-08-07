import React from "react";
interface PrintData { student: any; hostel: any; }
function fmtDate(d?: string | Date) { if (!d) return ""; return new Date(d).toLocaleDateString("en-IN"); }
function calcAge(d?: string | Date) { if (!d) return ""; return String(Math.floor((Date.now() - new Date(d).getTime()) / (365.25*24*3600*1000))); }
const GL: Record<string,string> = { BOYS:"Boys", GIRLS:"Girls", CO_ED:"Co-Ed" };

export default function MinimalTemplate({ student, hostel }: PrintData) {
  const addr = hostel?.address;
  const fullAddr = [addr?.street, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(", ");
  return (
    <div style={{ width:"210mm", minHeight:"297mm", margin:"0 auto", background:"#fff", fontFamily:"Arial, sans-serif", padding:"14mm 16mm", boxSizing:"border-box", color:"#111" }}>
      {/* Header */}
      <div style={{ borderBottom:"2px solid #111", paddingBottom:12, marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {hostel?.printLogoUrl && (
            <img src={hostel.printLogoUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: 100, objectFit: "contain" }} />
          )}
          <div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>{student?.propertyId?.name || hostel?.name || "Hostel Name"}</div>
            <div style={{ fontSize:9, color:"#555", marginTop:3 }}>{fullAddr}</div>
            {hostel?.contactPhone && <div style={{ fontSize:9, color:"#555" }}>📞 {hostel.contactPhone}</div>}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>Registration Form</div>
          <div style={{ fontSize:9, color:"#555", marginTop:2 }}>Date: {fmtDate(student?.registrationDate || student?.admissionDate)}</div>
          <div style={{ fontSize:9, color:"#555" }}>{GL[hostel?.gender] ?? "Co-Ed"} Hostel</div>
        </div>
      </div>
      {/* Photo */}
      <div style={{ float:"right", marginLeft:16, marginBottom:8 }}>
        <div style={{ width:60, height:75, border:"1px solid #ccc", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#aaa", overflow:"hidden" }}>
          {student?.photoUrl ? <img src={student.photoUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "Photo"}
        </div>
      </div>
      {/* Fields as simple rows */}
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:10 }}>
        <tbody>
          <MR label="Name of Tenant" value={student?.name} />
          <MR label="Father Name" value={student?.fatherName} />
          <MR label="Father Occupation" value={student?.fatherOccupation} extra="Contact" extraVal={student?.fatherContact} />
          <MR label="Mother Name" value={student?.motherName} />
          <MR label="Date of Birth" value={fmtDate(student?.dateOfBirth)} extra="Age" extraVal={calcAge(student?.dateOfBirth)} />
          <MR label="Blood Group" value={student?.bloodGroup} extra="Aadhaar No." extraVal={student?.aadhaarNumber} />
          <MR label="Marital Status" value={student?.maritalStatus} extra="Education" extraVal={student?.education} />
          <MR label="Email" value={student?.email} />
          <MR label="Occupation" value={student?.occupation} extra="Organization" extraVal={student?.organization} />
          <MR label="Mobile No." value={student?.phone} />
          <MR label="Permanent Address" value={student?.permanentAddress} />
          <MR label="Guardian Name" value={student?.guardianName} extra="Guardian Mobile" extraVal={student?.guardianPhone} />
          <MR label="Guardian Address" value={student?.guardianAddress} />
          <MR label="Vehicle No." value={student?.vehicleNumber} extra="Admission Date" extraVal={fmtDate(student?.admissionDate)} />
          <MR label="Medical History" value={student?.medicalHistory} />
        </tbody>
      </table>
      {/* Lock-in */}
      <div style={{ marginTop:14, borderTop:"1px solid #ddd", paddingTop:10, display:"flex", gap:20, alignItems:"center", fontSize:10 }}>
        <span style={{ fontWeight:700 }}>Lock-in Period:</span>
        {[["6_MONTHS","6 Months"],["12_MONTHS","12 Months"],["OTHER","Other"]].map(([val,lbl]) => (
          <label key={val} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:10, height:10, border:"1px solid #111", display:"inline-block", background:student?.stayingPeriod===val?"#111":"transparent" }} />{lbl}
          </label>
        ))}
      </div>
      {/* Signatures */}
      <div style={{ marginTop:40, display:"flex", justifyContent:"space-between", fontSize:10 }}>
        <div style={{ minWidth:140, textAlign:"center" }}><div style={{ borderTop:"1px solid #111", marginBottom:6 }} />Owner Signature</div>
        <div style={{ minWidth:140, textAlign:"center" }}><div style={{ borderTop:"1px solid #111", marginBottom:6 }} />Applicant Signature</div>
      </div>
    </div>
  );
}

function MR({ label, value, extra, extraVal }: { label:string; value?:string; extra?:string; extraVal?:string }) {
  return (
    <tr style={{ borderBottom:"1px solid #eee" }}>
      <td style={{ padding:"6px 8px 6px 0", color:"#555", fontWeight:600, whiteSpace:"nowrap", width:"30%", verticalAlign:"top" }}>{label}</td>
      <td style={{ padding:"6px 8px", verticalAlign:"top", width: extra ? "30%":"70%" }}>{value || <span style={{ color:"#ccc" }}>—</span>}</td>
      {extra && <><td style={{ padding:"6px 8px 6px 0", color:"#555", fontWeight:600, whiteSpace:"nowrap", width:"22%", verticalAlign:"top" }}>{extra}</td><td style={{ padding:"6px 0", verticalAlign:"top" }}>{extraVal || <span style={{ color:"#ccc" }}>—</span>}</td></>}
    </tr>
  );
}
