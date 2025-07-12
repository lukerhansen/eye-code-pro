"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doctor, InsurancePlan } from "@/lib/db/schema";

const DIAGNOSES = [
  "Routine eye exam (myopia, hyperopia, astigmatism, presbyopia)",
  "Medical diagnosis",
];

interface DoctorWithInsurances extends Doctor {
  acceptedInsurances: InsurancePlan[];
}

export default function CodePickerPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [acceptedInsurances, setAcceptedInsurances] = useState<InsurancePlan[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState<InsurancePlan | null>(null);
  const [freeExamBilled, setFreeExamBilled] = useState<boolean>(true);
  const [isEmergencyVisit, setIsEmergencyVisit] = useState<boolean>(false);
  const [patientType, setPatientType] = useState<"new" | "established">("new");
  const [level, setLevel] = useState<number>(4);
  const [diagnosis, setDiagnosis] = useState<string>(DIAGNOSES[0]);
  const [output, setOutput] = useState<string>("");
  const [billingEntryId, setBillingEntryId] = useState<number | null>(null);
  const [isFlagged, setIsFlagged] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<{ current: number; limit: number; displayed: number } | null>(null);

  // Derived visibility states
  const coversFreeExam = selectedInsurance?.coversFreeExam || false;
  const showFreeExamCheckbox = coversFreeExam;
  const showEmergencyCheckbox = coversFreeExam && !freeExamBilled;
  const showDiagnosisDropdown = selectedInsurance?.name === "Medicaid" && selectedDoctor?.degree === "OD";

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    // Reset emergency when conditions change
    if (!showEmergencyCheckbox) {
      setIsEmergencyVisit(false);
    }
  }, [showEmergencyCheckbox]);

  useEffect(() => {
    // When doctor changes, fetch their accepted insurances
    if (selectedDoctor) {
      fetchDoctorInsurances(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      const data = await response.json();
      if (response.ok) {
        setDoctors(data.doctors);
        setUsage(data.usage);
        if (data.doctors.length > 0) {
          setSelectedDoctor(data.doctors[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorInsurances = async (doctorId: number) => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}/insurances`);
      const data = await response.json();
      if (response.ok) {
        const accepted = data.insuranceAcceptances
          .filter((ia: any) => ia.isAccepted)
          .map((ia: any) => ia.insurancePlan);
        
        // Sort to prioritize Medicare and Medicaid
        const sortedAccepted = accepted.sort((a: any, b: any) => {
          const aPriority = (a.name === 'Medicare' || a.name === 'Medicaid') ? 0 : 1;
          const bPriority = (b.name === 'Medicare' || b.name === 'Medicaid') ? 0 : 1;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return a.name.localeCompare(b.name);
        });
        
        setAcceptedInsurances(sortedAccepted);
        if (sortedAccepted.length > 0) {
          setSelectedInsurance(sortedAccepted[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching doctor insurances:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedInsurance) {
      setOutput("Please select a doctor and insurance plan");
      return;
    }

    setOutput("Calculating…");
    try {
      const res = await fetch("/api/code-picker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          insurancePlan: selectedInsurance.name,
          freeExamBilledLastYear: freeExamBilled,
          patientType,
          level,
          diagnosis,
          doctor: selectedDoctor.name,
          isEmergencyVisit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unknown error");
      }
      const { recommendedCode, billingEntryId, debugInfo, diagnosisCode } = data;

      setBillingEntryId(billingEntryId ?? null);
      setIsFlagged(false);
      setDebugInfo(debugInfo);

      if (!recommendedCode) {
        setOutput("No CPT code available");
        return;
      }

      const codeDisplay = diagnosisCode ? `${recommendedCode} – ${diagnosisCode}` : recommendedCode;
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No doctors found. Please add doctors first.</p>
          <Button onClick={() => window.location.href = '/dashboard/doctors'}>
            Go to Doctors Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Eye-Care Billing Code Helper</h1>

      {/* Doctor & Insurance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Doctor</label>
          <Select
            value={selectedDoctor?.id.toString()}
            onValueChange={(value) => {
              const doctor = doctors.find(d => d.id === parseInt(value));
              setSelectedDoctor(doctor || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doc) => (
                <SelectItem key={doc.id} value={doc.id.toString()}>
                  {doc.name} ({doc.degree})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Insurance plan</label>
          <Select
            value={selectedInsurance?.id.toString()}
            onValueChange={(value) => {
              const insurance = acceptedInsurances.find(i => i.id === parseInt(value));
              setSelectedInsurance(insurance || null);
            }}
            disabled={acceptedInsurances.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an insurance" />
            </SelectTrigger>
            <SelectContent>
              {acceptedInsurances.map((insurance) => (
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
          <Select
            value={diagnosis}
            onValueChange={setDiagnosis}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select diagnosis" />
            </SelectTrigger>
            <SelectContent>
              {DIAGNOSES.map((d) => (
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
          <label className="block text-sm font-medium mb-1">Patient type</label>
          <Select
            value={patientType}
            onValueChange={(value) => setPatientType(value as "new" | "established")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select patient type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="established">Established</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Exam complexity level</label>
          <Select
            value={level.toString()}
            onValueChange={(value) => setLevel(parseInt(value))}
          >
            <SelectTrigger>
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
      <Button onClick={handleSubmit}>Get billing advice</Button>

      {/* Output */}
      {output && (
        <div className="mt-4 text-4xl md:text-6xl font-extrabold text-teal-600 text-center">
          {output}
        </div>
      )}

      {/* Debug Information */}
      {debugInfo?.codeComparison && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Code Comparison (Debug Info)</h3>
          <div className="space-y-2 text-sm">
            <div className="font-medium">Insurance Plan: {debugInfo.codeComparison.insurancePlan}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r pr-4">
                <div className="font-medium">Eye Code (92xxx)</div>
                <div>Code: {debugInfo.codeComparison.code1 || 'N/A'}</div>
                <div>Price: ${debugInfo.codeComparison.code1Price.toFixed(2)}</div>
              </div>
              <div className="pl-4">
                <div className="font-medium">E&M Code (99xxx)</div>
                <div>Code: {debugInfo.codeComparison.code2 || 'N/A'}</div>
                <div>Price: ${debugInfo.codeComparison.code2Price.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t">
              <div className="font-medium text-teal-600">
                Winner: {debugInfo.codeComparison.code1Price >= debugInfo.codeComparison.code2Price ? 
                  `${debugInfo.codeComparison.code1} ($${debugInfo.codeComparison.code1Price.toFixed(2)})` : 
                  `${debugInfo.codeComparison.code2} ($${debugInfo.codeComparison.code2Price.toFixed(2)})`
                }
              </div>
            </div>
          </div>
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