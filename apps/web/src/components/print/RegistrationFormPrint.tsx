import React from "react";
import ClassicTemplate from "./templates/ClassicTemplate";
import ModernTemplate from "./templates/ModernTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import ElegantTemplate from "./templates/ElegantTemplate";
import K1Template from "./templates/K1Template";

interface RegistrationFormPrintProps {
  student: any;
  hostel: any;
  template?: string;
}

export default function RegistrationFormPrint({ student, hostel, template }: RegistrationFormPrintProps) {
  const t = (template ?? hostel?.printTemplate ?? "classic").toLowerCase();
  if (t === "modern")  return <ModernTemplate  student={student} hostel={hostel} />;
  if (t === "minimal") return <MinimalTemplate student={student} hostel={hostel} />;
  if (t === "elegant") return <ElegantTemplate student={student} hostel={hostel} />;
  if (t === "k1")      return <K1Template      student={student} hostel={hostel} />;
  return <ClassicTemplate student={student} hostel={hostel} />;
}
