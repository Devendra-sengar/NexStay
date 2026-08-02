import { useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Printer, ArrowLeft, Eye, Loader2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useGetStudentForPrint, useAdminHostelInfo } from "@/lib/adminApi";
import RegistrationFormPrint from "@/components/print/RegistrationFormPrint";

const TEMPLATES = [
  { key: "classic",  label: "Classic",  desc: "Formal dotted lines" },
  { key: "modern",   label: "Modern",   desc: "Clean grid layout" },
  { key: "minimal",  label: "Minimal",  desc: "Simple rows" },
  { key: "elegant",  label: "Elegant",  desc: "Gold ornamental" },
  { key: "k1",       label: "K1 Template", desc: "Custom format" },
];

export default function PrintPreviewPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: student, isLoading: sLoad } = useGetStudentForPrint(studentId);
  const { data: hostel, isLoading: hLoad } = useAdminHostelInfo();

  const templateOverride = params.get("template") ?? undefined;
  const activeTemplate = templateOverride ?? hostel?.printTemplate ?? "classic";

  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `${student?.name || "Tenant"}_Registration`,
    pageStyle: `@page { size: A4; margin: 0; }`,
  });

  if (sLoad || hLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-lg font-semibold text-text-primary mb-2">Student not found</p>
          <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <>


      <div className="bg-white border-b border-surface-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-slate-300">|</span>
            <div>
              <p className="text-sm font-semibold text-text-primary">{student?.name}</p>
              <p className="text-xs text-text-muted">Registration Form Preview</p>
            </div>
          </div>

          {/* Template selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Template:</span>
            {TEMPLATES.map(t => (
              <button
                key={t.key}
                onClick={() => setParams(p => { const np = new URLSearchParams(p); np.set("template", t.key); return np; })}
                title={t.desc}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 transition-all ${
                  activeTemplate === t.key
                    ? "border-primary bg-primary text-white"
                    : "border-surface-border text-text-secondary hover:border-primary/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Preview area ── */}
      <div className="bg-slate-100 min-h-screen py-8 px-4">
        <div style={{ display: "inline-block", width: "100%", maxWidth: 820, margin: "0 auto" }}>
          {/* This is the container that will be printed via react-to-print */}
          <div ref={contentRef} style={{ transform: "scale(1)", transformOrigin: "top center", boxShadow: "0 4px 40px rgba(0,0,0,0.18)", borderRadius: 4, overflow: "hidden", background: "#fff", padding: "1px" }}>
            <RegistrationFormPrint
              student={student}
              hostel={hostel}
              template={activeTemplate}
            />
          </div>
        </div>
      </div>
    </>
  );
}
