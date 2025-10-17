"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEMO_DOCTORS,
  DEMO_INSURANCES,
  DEMO_DIAGNOSES,
  calculateDemoCode,
  type DemoDoctor,
  type DemoInsurance,
} from "@/lib/demo-data";

export default function DemoCodePicker() {
  const [selectedDoctor, setSelectedDoctor] = useState<DemoDoctor>(DEMO_DOCTORS[0]);
  const [selectedInsurance, setSelectedInsurance] = useState<DemoInsurance>(DEMO_INSURANCES[0]);
  const [freeExamBilled, setFreeExamBilled] = useState<boolean>(true);
  const [isEmergencyVisit, setIsEmergencyVisit] = useState<boolean>(false);
  const [patientType, setPatientType] = useState<"new" | "established">("new");
  const [level, setLevel] = useState<number>(4);
  const [diagnosis, setDiagnosis] = useState<string>(DEMO_DIAGNOSES[0]);
  const [output, setOutput] = useState<string>("");
  const [diagnosisCodeDisplay, setDiagnosisCode] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);

  // Derived visibility states
  const coversFreeExam = selectedInsurance?.coversFreeExam || false;
  const showFreeExamCheckbox = coversFreeExam;
  const showEmergencyCheckbox = coversFreeExam && !freeExamBilled;
  const showDiagnosisDropdown = selectedInsurance?.name === "Select Care Network" && selectedDoctor?.degree === "OD";

  const handleSubmit = () => {
    if (!selectedDoctor || !selectedInsurance) {
      setOutput("Please select a doctor and insurance plan.");
      return;
    }

    setOutput("Optimizing...");
    setDiagnosisCode(null);
    setIsAdditionalInfoExpanded(false);

    // Simulate a brief delay for realism
    setTimeout(() => {
      const result = calculateDemoCode({
        doctor: selectedDoctor,
        insurance: selectedInsurance,
        patientType,
        level,
        freeExamBilled,
        isEmergencyVisit,
        diagnosis,
      });

      setOutput(result.recommendedCode || "No CPT code available");
      setDiagnosisCode(result.diagnosisCode);
      setDebugInfo(result.debugInfo);

      // Track demo usage analytics (fire-and-forget)
      if (result.recommendedCode) {
        fetch('/api/demo-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorDegree: selectedDoctor.degree,
            insuranceName: selectedInsurance.name,
            patientType,
            level,
            recommendedCode: result.recommendedCode,
          }),
        }).catch((error) => {
          // Silently fail - don't interrupt user experience
          console.error('Failed to track demo analytics:', error);
        });
      }
    }, 300);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Doctor & Insurance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Doctor</label>
          <Select
            value={selectedDoctor?.id.toString()}
            onValueChange={(value) => {
              const doctor = DEMO_DOCTORS.find(d => d.id === parseInt(value));
              if (doctor) setSelectedDoctor(doctor);
            }}
          >
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select a doctor" />
            </SelectTrigger>
            <SelectContent>
              {DEMO_DOCTORS.map((doc) => (
                <SelectItem key={doc.id} value={doc.id.toString()}>
                  {doc.name} ({doc.degree})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Insurance plan</label>
          <Select
            value={selectedInsurance?.id.toString()}
            onValueChange={(value) => {
              const insurance = DEMO_INSURANCES.find(i => i.id === parseInt(value));
              if (insurance) setSelectedInsurance(insurance);
            }}
          >
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select an insurance" />
            </SelectTrigger>
            <SelectContent>
              {DEMO_INSURANCES.map((insurance) => (
                <SelectItem key={insurance.id} value={insurance.id.toString()}>
                  {insurance.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conditional checkboxes */}
      {showFreeExamCheckbox && (
        <div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={freeExamBilled}
              onChange={(e) => setFreeExamBilled(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            An annual preventative exam has already been billed in the last 12 months
          </label>
        </div>
      )}

      {showEmergencyCheckbox && (
        <div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isEmergencyVisit}
              onChange={(e) => setIsEmergencyVisit(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            This is an emergency visit
          </label>
        </div>
      )}

      {/* Diagnosis */}
      {showDiagnosisDropdown && (
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Primary diagnosis</label>
          <Select
            value={diagnosis}
            onValueChange={setDiagnosis}
          >
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select diagnosis" />
            </SelectTrigger>
            <SelectContent>
              {DEMO_DIAGNOSES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Patient type & level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Patient type</label>
          <Select
            value={patientType}
            onValueChange={(value) => setPatientType(value as "new" | "established")}
          >
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select patient type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="established">Established</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Exam complexity level</label>
          <Select
            value={level.toString()}
            onValueChange={(value) => setLevel(parseInt(value))}
          >
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5].map((lvl) => (
                <SelectItem key={lvl} value={lvl.toString()}>
                  Level {lvl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        className="w-full md:w-auto bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
      >
        Get Recommended Code
      </Button>

      {/* Output */}
      {output && output !== "Optimizing..." && (
        <div className="mt-6 text-center">
          <div className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
            {output}
          </div>
          {diagnosisCodeDisplay && (
            <div className="mt-2 text-base md:text-lg text-gray-600">
              {diagnosisCodeDisplay}
            </div>
          )}
        </div>
      )}

      {output === "Optimizing..." && (
        <div className="mt-6 text-center">
          <div className="text-2xl text-gray-500">Optimizing...</div>
        </div>
      )}

      {/* Additional Information */}
      {debugInfo?.codeComparison && debugInfo.codeComparison.code1 && debugInfo.codeComparison.code2 && (
        <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
          <button
            onClick={() => setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded)}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">Price Comparison</h3>
            {isAdditionalInfoExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>
          {isAdditionalInfoExpanded && (
            <div className="px-4 pb-4 space-y-3 text-sm">
              <div className="font-medium text-gray-700">Insurance Plan: {debugInfo.codeComparison.insurancePlan}</div>
              <div className="grid grid-cols-2 gap-6">
                <div className="border-r border-gray-200 pr-4">
                  <div className="font-semibold text-gray-900 mb-2">Eye Code (92xxx)</div>
                  <div className="text-gray-700">Code: {debugInfo.codeComparison.code1 || 'N/A'}</div>
                  <div className="text-gray-700">Reimbursement: <span className="font-semibold">${debugInfo.codeComparison.code1Price.toFixed(2)}</span></div>
                </div>
                <div className="pl-4">
                  <div className="font-semibold text-gray-900 mb-2">E&M Code (99xxx)</div>
                  <div className="text-gray-700">Code: {debugInfo.codeComparison.code2 || 'N/A'}</div>
                  <div className="text-gray-700">Reimbursement: <span className="font-semibold">${debugInfo.codeComparison.code2Price.toFixed(2)}</span></div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                  Best Choice: {debugInfo.codeComparison.code1Price >= debugInfo.codeComparison.code2Price ?
                    `${debugInfo.codeComparison.code1} (saves $${(debugInfo.codeComparison.code1Price - debugInfo.codeComparison.code2Price).toFixed(2)})` :
                    `${debugInfo.codeComparison.code2} (saves $${(debugInfo.codeComparison.code2Price - debugInfo.codeComparison.code1Price).toFixed(2)})`
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
