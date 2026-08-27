import React from "react";

interface PrintData { student: any; hostel: any; }

function fmtDate(d?: string | Date) { if (!d) return ""; return new Date(d).toLocaleDateString("en-IN"); }
function calcAge(d?: string | Date) { if (!d) return ""; const diff = Date.now() - new Date(d).getTime(); return String(Math.floor(diff / (365.25 * 24 * 3600 * 1000))); }
const GENDER_LABEL: Record<string, string> = { BOYS: "Boys", GIRLS: "Girls", CO_ED: "Co-Ed" };

export default function ClassicTemplate({ student, hostel }: PrintData) {
  const addr = hostel?.address;
  const fullAddr = [addr?.street, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(", ");
  const gender = GENDER_LABEL[hostel?.gender] ?? "Co-Ed";
  const cs = (extra?: React.CSSProperties): React.CSSProperties => ({ ...extra });

  const outerWrap: React.CSSProperties = { width: "210mm", minHeight: "297mm", margin: "0 auto", background: "#fff", fontFamily: '"Times New Roman", Times, serif', padding: "8mm", boxSizing: "border-box", position: "relative", color: "#000" };
  const innerPad: React.CSSProperties = { padding: "8mm 10mm", position: "relative" };

  return (
    <>
      <div style={outerWrap}>
      <div style={{ position: "absolute", inset: "4mm", border: "3px solid #000", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: "6.5mm", border: "1px solid #000", pointerEvents: "none" }} />
      {[{ top: "5mm", left: "5mm" }, { top: "5mm", right: "5mm" }, { bottom: "5mm", left: "5mm" }, { bottom: "5mm", right: "5mm" }].map((s, i) => (
        <div key={i} style={{ position: "absolute", ...s, width: 12, height: 12, border: "2px solid #000", borderRadius: "50%" }} />
      ))}
      <div style={innerPad}>
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ display: "inline-block", background: "#111", color: "#fff", padding: "4px 28px", fontSize: 11, fontWeight: 800, letterSpacing: 3 }}>REGISTRATION FORM</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ flex: 1, display: "flex", gap: "16px", alignItems: "center" }}>
            {hostel?.printLogoUrl && (
              <img src={hostel.printLogoUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: 100, objectFit: "contain" }} />
            )}
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, marginBottom: 4, textTransform: "uppercase" }}>{student?.propertyId?.name || hostel?.name || "Hostel Name"}</div>
              <div style={{ fontSize: 9, lineHeight: 1.8, color: "#333" }}>
                {fullAddr && <div>{fullAddr}</div>}
                {hostel?.contactPhone && <div>Contact: {hostel.contactPhone}</div>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginLeft: 16 }}>
            <div style={{ width: 66, height: 80, border: "1.5px solid #444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#aaa", overflow: "hidden" }}>
              {student?.photoUrl ? <img src={student.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "Photo"}
            </div>
            <div style={{ background: "#111", color: "#fff", padding: "2px 12px", fontSize: 10, fontWeight: 700 }}>{gender}</div>
          </div>
        </div>
        <div style={{ borderTop: "3px solid #000", paddingTop: 2, borderBottom: "1px solid #000", marginBottom: 10 }} />
        <div style={{ textAlign: "right", fontSize: 10, marginBottom: 10 }}>
          Date......<strong>{(student?.registrationDate || student?.admissionDate) ? fmtDate(student.registrationDate || student.admissionDate) : "...................."}</strong>
        </div>
        <div style={{ fontSize: 10 }}>
          <FL label="Name of Tenant" value={student?.name} />
          <FL label="Father Name" value={student?.fatherName} />
          <SL label1="Father Occupation" value1={student?.fatherOccupation} label2="Contact" value2={student?.fatherContact} />
          <FL label="Mother Name" value={student?.motherName} />
          <TL label1="Date of Birth" value1={fmtDate(student?.dateOfBirth)} label2="Age" value2={calcAge(student?.dateOfBirth)} label3="Blood Group" value3={student?.bloodGroup} />
          <FL label="Adhar Card No." value={student?.aadhaarNumber} />
          <SL label1="Marital Status" value1={student?.maritalStatus} label2="Education" value2={student?.education} />
          <FL label="Email Address" value={student?.email} />
          <SL label1="Occupation" value1={student?.occupation} label2="Organization" value2={student?.organization} />
          <FL label="Mobile No." value={student?.phone} />
          <FL label="Permanent Address" value={student?.permanentAddress} />
          <FL label="Name & Address of Local Guardian" value={[student?.guardianName, student?.guardianAddress].filter(Boolean).join(", ")} />
          <FL label="Mobile No. of Local Guardian" value={student?.guardianPhone} />
          <SL label1="Vehicle No." value1={student?.vehicleNumber} label2="Date of Admission" value2={fmtDate(student?.admissionDate)} />
          <FL label="Medical History (If Any Disease)" value={student?.medicalHistory} />
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 24, fontSize: 10 }}>
          <span style={{ fontWeight: 700 }}>Lock-in Period</span>
          {[["6", "6 Month"], ["12", "12 Month"], ["OTHER", "Other"]].map(([val, lbl]) => {
            const sp = String(student?.stayingPeriod || "");
            const isMatch = val === "OTHER" ? (sp && sp !== "6" && sp !== "12") : sp === val;
            return (
              <label key={val} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 13, height: 13, border: "1.5px solid #000", display: "inline-block", background: isMatch ? "#000" : "transparent", flexShrink: 0 }} />
                {lbl} {val === "OTHER" && isMatch ? `(${sp} Months)` : ""}
              </label>
            );
          })}
        </div>
        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", fontSize: 10 }}>
          <div style={{ textAlign: "center", minWidth: 140 }}><div style={{ borderTop: "1.5px solid #000", marginBottom: 5 }} /><strong>Signature of Owner</strong></div>
          <div style={{ textAlign: "center", minWidth: 140 }}><div style={{ borderTop: "1.5px solid #000", marginBottom: 5 }} /><strong>Applicant Signature</strong></div>
        </div>
      </div>
    </div>

    {/* Terms and Conditions Page */}
      <div style={{ ...outerWrap, marginTop: "20mm", pageBreakBefore: "always" }}>
        <div style={{ position: "absolute", inset: "4mm", border: "3px solid #000", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: "6.5mm", border: "1px solid #000", pointerEvents: "none" }} />
        <div style={innerPad}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "inline-block", background: "#111", color: "#fff", padding: "4px 28px", fontSize: 14, fontWeight: 800 }}>नियम व शर्तें</div>
          </div>
          
          <div style={{ fontSize: 13, lineHeight: 1.8, padding: "0 10px" }}>
            <ol style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li>किराया हर महीने की 1 से 5 तारीख तक जमा कराना अनिवार्य है और छात्रावास की सुरक्षा राशि जब रूम खाली करेगा उसके अगले महीने की 15 तारीख को उनकी सुरक्षा राशि वापस कर दी जाएगी।</li>
              <li>शाखा को बिजली बिल का भुगतान 12 रू प्रति यूनिट अलग से करना होगा।</li>
              <li>हॉस्टल के बाहर रुकने पर, घर या आउट ऑफ स्टेशन जाने पर लिखित रूप से सूचना देना अनिवार्य है।</li>
              <li>हॉस्टल में दिया जाने वाला सामान इस्तेमाल कर सकते है उसके अलावा इंडक्शन व केटल आदि का चार्ज 500/- अलग रहेगा बिना इजाजत इंडक्शन या आदि सामान का इस्तेमाल करते पाए जाने पर 1000रू जुर्माना लगेगा या हॉस्टल से निष्काषित कर दिया जाएगा।</li>
              <li>फिजूल की बिजली और पानी बर्बाद करते पाए जाने पर 500/- प्रति टेनेंट जुर्माना भरना पड़ेगा।</li>
              <li>कमरे के अंदर कोई भी नुकसान पाये जाने पर टेनेंट की सुरक्षा राशि से भरपाई की जाएगी।</li>
              <li>हॉस्टल के बाहर किसी भी प्रकार की जिम्मेदारी हॉस्टल मैनेजमेंट की नहीं रहेगी।</li>
              <li>कमरे के अंदर गीजर, बल्ब पंखा, टेबल, कुर्सी, अलमारी, नल फ्लश, ए.सी. आदि के मेन्टेनेन्स की जिम्मेदारी कमरे में रहने वाले छात्रा की होगी। चाबी सौपने के बाद टेनेंट और मालिक दोनो द्वारा रूम को जांच लिया जायेगा।</li>
              <li>टेनेंट को अपने-अपने वाहन अपने जोखिम पर बाहर पार्क करने होगें, इसकी जिम्मेदारी हमारी (हॉस्टल) की नहीं होगी।</li>
              <li>टेनेंट को तब तक हॉस्टल में रहना होगा जब तक उन्होने अपने पंजीकरण फॉर्म में बताया है, यदि छात्रा उल्लखित समय से पहले छोड़ना चाहते है तो उनकी सुरक्षा राशि वापिस नहीं दी जाएगी।</li>
              <li>कमरा खाली करने से 1 महीने पहले लिखित रूप से नोटिस देना अनिवार्य है, ऐसा न करने पर सुरक्षा राशि किसी भी स्थिति में वापिस नहीं की जायेगी।</li>
              <li>मालिक किसी भी समय कमरे का निरीक्षण करने का अधिकार रखते है।</li>
              <li>टेनेंट को किसी भी प्रकार का दीवारों पर पोस्टर या कीले नहीं लगानी है, ऐसा पाये जाने पर 500/- रू प्रति छात्रा जुर्माना लिया जायेगा।</li>
              <li>हर साल किराया 10% बढ़ाया जाएगा।</li>
              <li>Visitors को कमरे में बिठाना अथवा किसी भी व्यक्ति को कमरे में रूकवाना सख्त मना है, ऐसा करते पाए जाने पर 1000/- प्रति टेनेंट जुर्माना देना होगा या हॉस्टल खाली करवाया जा सकता है।</li>
              <li>कमरे के अंदर आपके जरूरी सामान की जिम्मेदारी आपकी स्वयं की है, कुछ भी गायब या खराब होने पर जिम्मेदारी हमारी (हॉस्टल) की नहीं होगी।</li>
              <li>हॉस्टल में रहने वाली टेनेंट को हॉस्टल के आस-पास नशा करते या लड़कों के साथ खड़े रहना सख्त मना है।</li>
              <li>5 तारीख के बाद किराया न देने पर 50रू/दिन- जुर्माना लगेगा।</li>
              <li>सेमेस्टर, ब्रेक, त्योहार पर किराये में कोई भी छूट नहीं मिलेगी।</li>
              <li>बिजली का बिल किराये के साथ देना अनिवार्य है।</li>
              <li>कोई भी व्यक्ति कमरे में शोर शराबा या उपद्रव करता पाया जाता है उसे व्यक्ति को निष्काषित किया जा सकता है।</li>
              <li>डिपोजिट राशि का किराये में एडजस्टमेंट नहीं किया जायेगा। बिल्डिंग मेंटेनेंस 1000 रू. सालाना कोशन मनी से काटी जायेगी।</li>
            </ol>
          </div>

          <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <div style={{ textAlign: "center", minWidth: 160 }}><div style={{ borderTop: "1.5px solid #000", marginBottom: 5 }} /><strong>हस्ताक्षर</strong></div>
            <div style={{ textAlign: "center", minWidth: 160 }}><div style={{ borderTop: "1.5px solid #000", marginBottom: 5 }} /><strong>छात्रा हस्ताक्षर</strong></div>
          </div>
        </div>
      </div>
    </>
  );
}

function FL({ label, value }: { label: string; value?: string }) {
  return <div style={{ display: "flex", alignItems: "baseline", marginBottom: 10, gap: 4 }}><span style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{label}</span><span style={{ flex: 1, borderBottom: "1px dotted #666", display: "inline-block", paddingBottom: 1, minWidth: 40 }}>{value ?? ""}</span></div>;
}
function SL({ label1, value1, label2, value2 }: { label1: string; value1?: string; label2: string; value2?: string }) {
  return <div style={{ display: "flex", gap: 8, marginBottom: 10 }}><div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 4 }}><span style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{label1}</span><span style={{ flex: 1, borderBottom: "1px dotted #666", display: "inline-block", minWidth: 30 }}>{value1 ?? ""}</span></div><div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 4 }}><span style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{label2}</span><span style={{ flex: 1, borderBottom: "1px dotted #666", display: "inline-block", minWidth: 30 }}>{value2 ?? ""}</span></div></div>;
}
function TL({ label1, value1, label2, value2, label3, value3 }: { label1: string; value1?: string; label2: string; value2?: string; label3: string; value3?: string }) {
  return <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>{[[label1, value1, 2], [label2, value2, 1], [label3, value3, 1]].map(([lbl, val, flex], i) => (<div key={i} style={{ flex: flex as number, display: "flex", alignItems: "baseline", gap: 3 }}><span style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{lbl as string}</span><span style={{ flex: 1, borderBottom: "1px dotted #666", display: "inline-block", minWidth: 20 }}>{val as string ?? ""}</span></div>))}</div>;
}
