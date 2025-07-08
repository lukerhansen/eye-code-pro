"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { INSURANCE_PLANS } from "@/lib/insurance-data";

const DOCTORS: Record<string, string> = {
  "Dr. Jensen": "OD",
  "Dr. Hansen": "MD",
  "Dr. Hillam": "DO",
};

const DIAGNOSIS_CODE_MAP: Record<string, string> = {
  "Routine eye exam (myopia, hyperopia, astigmatism, presbyopia)": "H52.13",
  "Medical diagnosis": "Z01.00",
};

const DIAGNOSES = Object.keys(DIAGNOSIS_CODE_MAP);

export default function CodePickerPage() {
  const insuranceOptions = Object.keys(INSURANCE_PLANS);
  const doctorOptions = Object.keys(DOCTORS);

  const [insurancePlan, setInsurancePlan] = useState<string>(insuranceOptions[0]);
  const [doctor, setDoctor] = useState<string>(doctorOptions[0]);
  const [freeExamBilled, setFreeExamBilled] = useState<boolean>(true);
  const [isEmergencyVisit, setIsEmergencyVisit] = useState<boolean>(false);
  const [patientType, setPatientType] = useState<"new" | "established">("new");
  const [level, setLevel] = useState<number>(4);
  const [diagnosis, setDiagnosis] = useState<string>(DIAGNOSES[0]);
  const [output, setOutput] = useState<string>("");
  const [billingEntryId, setBillingEntryId] = useState<number | null>(null);
  const [isFlagged, setIsFlagged] = useState<boolean>(false);

  // Derived visibility states
  const coversFreeExam = INSURANCE_PLANS[insurancePlan];
  const showFreeExamCheckbox = coversFreeExam;
  const showEmergencyCheckbox = coversFreeExam && !freeExamBilled;
  const showDiagnosisDropdown = insurancePlan === "Medicaid" && DOCTORS[doctor] === "OD";

  useEffect(() => {
    // Reset emergency when conditions change
    if (!showEmergencyCheckbox) {
      setIsEmergencyVisit(false);
    }
  }, [showEmergencyCheckbox]);

  const handleSubmit = async () => {
    setOutput("Calculating…");
    try {
      const res = await fetch("/api/code-picker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insurancePlan,
          freeExamBilledLastYear: freeExamBilled,
          patientType,
          level,
          diagnosis,
          doctor,
          isEmergencyVisit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unknown error");
      }
      const { recommendedCode, billingEntryId } = data;

      setBillingEntryId(billingEntryId ?? null);
      setIsFlagged(false);

      if (!recommendedCode) {
        setOutput("No CPT code available");
        return;
      }

      const diagCode = DIAGNOSIS_CODE_MAP[diagnosis];
      const codeDisplay = diagCode ? `${recommendedCode} – ${diagCode}` : recommendedCode;
      setOutput(codeDisplay);
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
    }
  };

  const handleFlag = async () => {
    if (!billingEntryId) return;

    try {
      await fetch("/api/billing-entries/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: billingEntryId }),
      });
      setIsFlagged(true);
    } catch (err) {
      console.error("Failed to flag entry", err);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Eye-Care Billing Code Helper</h1>

      {/* Insurance & doctor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Insurance plan</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={insurancePlan}
            onChange={(e) => setInsurancePlan(e.target.value)}
          >
            {insuranceOptions.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Doctor</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
          >
            {doctorOptions.map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional checkboxes */}
      {showFreeExamCheckbox && (
        <div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={freeExamBilled}
              onChange={(e) => setFreeExamBilled(e.target.checked)}
            />
            A free exam has already been billed in the last 12 months
          </label>
        </div>
      )}

      {showEmergencyCheckbox && (
        <div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={isEmergencyVisit}
              onChange={(e) => setIsEmergencyVisit(e.target.checked)}
            />
            This is an emergency visit
          </label>
        </div>
      )}

      {/* Diagnosis */}
      {showDiagnosisDropdown && (
        <div>
          <label className="block text-sm font-medium mb-1">Primary diagnosis</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          >
            {DIAGNOSES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Patient type & level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Patient type</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={patientType}
            onChange={(e) => setPatientType(e.target.value as "new" | "established")}
          >
            <option value="new">new</option>
            <option value="established">established</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Exam complexity level</label>
          <select
            className="w-full border rounded-md px-3 py-2"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          >
            {[2, 3, 4, 5].map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit}>Get billing advice</Button>

      {/* Output */}
      {output && (
        <div className="mt-4 text-4xl md:text-6xl font-extrabold text-teal-600 text-center">
          {output}
        </div>
      )}

      {/* Flag button */}
      {billingEntryId && !isFlagged && (
        <Button
          variant="outline"
          className="mt-4 flex items-center gap-2 border-red-500 text-red-600"
          onClick={handleFlag}
        >
          <Flag className="h-5 w-5" /> Flag as incorrect
        </Button>
      )}
    </div>
  );
} 