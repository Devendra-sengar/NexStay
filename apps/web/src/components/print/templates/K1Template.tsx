import React from "react";
import { Home } from "lucide-react";

interface PrintData { student: any; hostel: any; }

function fmtDate(d?: string | Date) { if (!d) return ""; return new Date(d).toLocaleDateString("en-IN"); }
function calcAge(d?: string | Date) { if (!d) return ""; const diff = Date.now() - new Date(d).getTime(); return String(Math.floor(diff / (365.25 * 24 * 3600 * 1000))); }
const GENDER_LABEL: Record<string, string> = { BOYS: "Boys", GIRLS: "Girls", CO_ED: "Co-Ed" };

export default function K1Template({ student, hostel }: PrintData) {
  const prop = student?.propertyId;
  const addr = hostel?.address || prop?.address;
  const locality = hostel?.locality || prop?.locality;
  const city = hostel?.city || prop?.city;
  const state = hostel?.state || prop?.state;
  const pincode = hostel?.pincode || prop?.pincode;
  const fullAddr = [addr, locality, city, state, pincode].filter(Boolean).join(", ") || "Plot No. 210, Sch. No. 113, Near Brilliant Convention, Vijay Nagar, Indore (M.P.)";
  const gender = GENDER_LABEL[hostel?.gender] ?? "Co-Ed";
  const propertyName = student?.propertyId?.name || hostel?.name || "K1 HOMES";
  const contactStr = hostel?.contactPhone ? hostel.contactPhone : "7000508330, 8770144457";

  const outerWrap: React.CSSProperties = { 
    width: "210mm", 
    minHeight: "297mm", 
    margin: "0 auto", 
    background: "#fff", 
    fontFamily: '"Times New Roman", Times, serif', 
    padding: "8mm", 
    boxSizing: "border-box", 
    position: "relative", 
    color: "#000" 
  };
  const innerPad: React.CSSProperties = { padding: "12mm 15mm", position: "relative" };

  return (
    <>
      <div style={outerWrap}>
        {/* Ornamental Border Simulation */}
        <div style={{ position: "absolute", inset: "4mm", border: "4px solid #111", pointerEvents: "none", borderRadius: "10px" }} />
        <div style={{ position: "absolute", inset: "6mm", border: "1.5px solid #111", pointerEvents: "none", borderRadius: "8px" }} />
        
        {/* Corner Ornaments */}
        {[{ top: "3mm", left: "3mm" }, { top: "3mm", right: "3mm" }, { bottom: "3mm", left: "3mm" }, { bottom: "3mm", right: "3mm" }].map((s, i) => (
          <svg key={i} width="30" height="30" viewBox="0 0 30 30" style={{ position: "absolute", ...s, fill: "none", stroke: "#000", strokeWidth: 1.5 }}>
            <path d="M0,15 Q15,15 15,0 M15,30 Q15,15 30,15" />
            <circle cx="15" cy="15" r="8" fill="#fff" stroke="#000" />
            <circle cx="15" cy="15" r="3" fill="#000" />
          </svg>
        ))}

        {/* Header Registration Form Label overlapping the border */}
        <div style={{ position: "absolute", top: "1.5mm", left: "50%", transform: "translateX(-50%)", background: "#000", color: "#fff", padding: "4px 30px", fontSize: 16, fontWeight: 700, borderRadius: "6px" }}>
          Registration Form
        </div>

        <div style={innerPad}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ flex: 1, paddingTop: 10, minWidth: 0 }}>
              {/* Property Title */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {hostel?.printLogoUrl && (
                  <img src={hostel.printLogoUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: 100, objectFit: "contain", marginRight: 12 }} />
                )}
                {propertyName.split(' ').map((word: string, idx: number) => {
                  if (idx === 0) {
                    return <span key={idx} style={{ fontSize: 50, fontWeight: 900, textTransform: "uppercase", letterSpacing: -1, paddingRight: 4, fontFamily: "Arial, sans-serif" }}>{word}</span>;
                  }
                  return (
                    <span key={idx} style={{ background: "#000", color: "#fff", padding: "4px 10px", fontSize: 36, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Arial, sans-serif" }}>
                      {word}
                    </span>
                  );
                })}
              </div>

              {/* Gradient lines under the title */}
              <div style={{ height: "3px", background: "linear-gradient(90deg, rgba(200,200,200,0) 0%, rgba(100,100,100,1) 50%, rgba(200,200,200,0) 100%)", marginBottom: 3 }} />
              <div style={{ height: "1px", background: "linear-gradient(90deg, rgba(200,200,200,0) 0%, rgba(100,100,100,1) 50%, rgba(200,200,200,0) 100%)", marginBottom: 5 }} />

              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, lineHeight: 1.5, color: "#111" }}>
                <div>{fullAddr}</div>
                <div>Contact : {contactStr}</div>
              </div>
              <div style={{ height: "1px", background: "linear-gradient(90deg, rgba(200,200,200,0) 0%, rgba(100,100,100,1) 50%, rgba(200,200,200,0) 100%)", marginTop: 5 }} />
            </div>

            {/* Right side: Photo & Icon */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginLeft: 15, flexShrink: 0, zIndex: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Home strokeWidth={2.5} size={60} color="#000" fill="#000" />
                <span style={{ fontSize: 24, fontWeight: 500, fontFamily: "serif", marginTop: -5, whiteSpace: "nowrap" }}>{gender}</span>
              </div>
              <div style={{ width: 90, height: 120, border: "1.5px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#444", background: "#fff" }}>
                {student?.photoUrl ? <img src={student.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>Photo</span>}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: 13, marginBottom: 15, fontWeight: 700, display: "flex", justifyContent: "flex-end", alignItems: "baseline" }}>
            Date <span style={{ display: "inline-block", width: 140, borderBottom: "2px dotted #000", marginLeft: 8, paddingBottom: 2, textAlign: "center" }}>{student?.admissionDate ? fmtDate(student.admissionDate) : ""}</span>
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.5, display: "flex", flexDirection: "column", gap: 18 }}>
            <FL label="Name of Tenant" value={student?.name} />
            <FL label="Father's Name" value={student?.fatherName} />
            <SL label1="Father's Occupation" value1={student?.fatherOccupation} label2="Contact" value2={student?.fatherContact} />
            <FL label="Mother's Name" value={student?.motherName} />
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

          <div style={{ marginTop: 25, display: "flex", alignItems: "center", gap: 80, fontSize: 14, fontWeight: 700 }}>
            <span>Lock-in Period</span>
            <div style={{ display: "flex", gap: 50 }}>
              {[["6_MONTHS", "6 Month"], ["12_MONTHS", "12 Month"]].map(([val, lbl]) => (
                <label key={val} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  {lbl}
                  <div style={{ width: 35, height: 16, border: "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {student?.stayingPeriod === val && <span style={{ display: "inline-block", width: 27, height: 10, background: "#000" }} />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 65, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <div style={{ textAlign: "center", minWidth: 200 }}><div style={{ borderTop: "2px solid #000", marginBottom: 8 }} /><strong>Signature of Owner</strong></div>
            <div style={{ textAlign: "center", minWidth: 200 }}><div style={{ borderTop: "2px solid #000", marginBottom: 8 }} /><strong>Applicant Signature</strong></div>
          </div>
        </div>
      </div>

      <div style={{ ...outerWrap, marginTop: "20mm", pageBreakBefore: "always" }}>
        <div style={{ position: "absolute", inset: "4mm", border: "4px solid #111", pointerEvents: "none", borderRadius: "10px" }} />
        <div style={{ position: "absolute", inset: "6mm", border: "1.5px solid #111", pointerEvents: "none", borderRadius: "8px" }} />
        <div style={innerPad}>
          <div style={{ position: "absolute", top: "1.5mm", left: "50%", transform: "translateX(-50%)", background: "#000", color: "#fff", padding: "4px 30px", fontSize: 16, fontWeight: 700, borderRadius: "6px" }}>नियम व शर्तें</div>
          
          <div style={{ fontSize: 15, lineHeight: 1.8, padding: "20px 10px 0 10px" }}>
            <ol style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
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

          <div style={{ marginTop: 60, display: "flex", justifyContent: "space-between", fontSize: 15 }}>
            <div style={{ textAlign: "center", minWidth: 180 }}><div style={{ borderTop: "2px solid #000", marginBottom: 8 }} /><strong>हस्ताक्षर</strong></div>
            <div style={{ textAlign: "center", minWidth: 180 }}><div style={{ borderTop: "2px solid #000", marginBottom: 8 }} /><strong>छात्रा हस्ताक्षर</strong></div>
          </div>
        </div>
      </div>
    </>
  );
}

function FL({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, borderBottom: "2.5px dotted #111", position: "relative", minHeight: 18 }}>
        <span style={{ position: "absolute", bottom: 2, left: 10, fontWeight: 700 }}>{value ?? ""}</span>
      </span>
    </div>
  );
}
function SL({ label1, value1, label2, value2 }: { label1: string; value1?: string; label2: string; value2?: string }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{label1}</span>
        <span style={{ flex: 1, borderBottom: "2.5px dotted #111", position: "relative", minHeight: 18 }}>
          <span style={{ position: "absolute", bottom: 2, left: 10, fontWeight: 700 }}>{value1 ?? ""}</span>
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{label2}</span>
        <span style={{ flex: 1, borderBottom: "2.5px dotted #111", position: "relative", minHeight: 18 }}>
          <span style={{ position: "absolute", bottom: 2, left: 10, fontWeight: 700 }}>{value2 ?? ""}</span>
        </span>
      </div>
    </div>
  );
}
function TL({ label1, value1, label2, value2, label3, value3 }: { label1: string; value1?: string; label2: string; value2?: string; label3: string; value3?: string }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {[[label1, value1, 2], [label2, value2, 1], [label3, value3, 1]].map(([lbl, val, flex], i) => (
        <div key={i} style={{ flex: flex as number, display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{lbl as string}</span>
          <span style={{ flex: 1, borderBottom: "2.5px dotted #111", position: "relative", minHeight: 18 }}>
            <span style={{ position: "absolute", bottom: 2, left: 10, fontWeight: 700 }}>{val as string ?? ""}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
