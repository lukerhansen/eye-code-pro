'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, DollarSign, Plus, Trash2 } from 'lucide-react';
import type { Doctor, InsurancePlan } from '@/lib/db/schema';

interface InsuranceAcceptance {
  insurancePlan: InsurancePlan;
  isAccepted: boolean;
  useCustomFeeSchedule: boolean;
  coversFreeExam: boolean | null; // null = use insurance default
  doctorInsuranceId?: number;
  customFees: { code: string; amount: number }[];
}

interface FeeSchedule {
  code: string;
  amount: number;
}

const CPT_CODES = [
  '92002', '92004', '92012', '92014',
  '99202', '99203', '99204', '99205',
  '99212', '99213', '99214', '99215'
];

export default function DoctorInsurancesPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [insuranceAcceptances, setInsuranceAcceptances] = useState<InsuranceAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<number, boolean>>({});
  const [editingInsurance, setEditingInsurance] = useState<InsuranceAcceptance | null>(null);
  const [feeScheduleDialogOpen, setFeeScheduleDialogOpen] = useState(false);
  const [defaultFees, setDefaultFees] = useState<FeeSchedule[]>([]);
  const [customFees, setCustomFees] = useState<Record<string, string>>({});
  const [customInsuranceDialogOpen, setCustomInsuranceDialogOpen] = useState(false);
  const [newInsuranceName, setNewInsuranceName] = useState('');
  const [newInsuranceCoversFreeExam, setNewInsuranceCoversFreeExam] = useState(false);
  const [savingCustomInsurance, setSavingCustomInsurance] = useState(false);

  useEffect(() => {
    fetchDoctorAndInsurances();
  }, [doctorId]);

  const fetchDoctorAndInsurances = async () => {
    try {
      // Fetch doctor info
      const doctorResponse = await fetch('/api/doctors');
      const doctorData = await doctorResponse.json();
      const currentDoctor = doctorData.doctors.find((d: Doctor) => d.id === parseInt(doctorId));
      setDoctor(currentDoctor);

      // Fetch insurance acceptances
      const insuranceResponse = await fetch(`/api/doctors/${doctorId}/insurances`);
      const insuranceData = await insuranceResponse.json();
      if (insuranceResponse.ok) {
        // Sort to prioritize Medicare and Medicaid when accepted
        const sortedAcceptances = insuranceData.insuranceAcceptances.sort((a: InsuranceAcceptance, b: InsuranceAcceptance) => {
          // First, prioritize accepted Medicare and Medicaid
          const aIsPriority = a.isAccepted && (a.insurancePlan.name === 'Medicare' || a.insurancePlan.name === 'Medicaid');
          const bIsPriority = b.isAccepted && (b.insurancePlan.name === 'Medicare' || b.insurancePlan.name === 'Medicaid');
          
          if (aIsPriority && !bIsPriority) return -1;
          if (!aIsPriority && bIsPriority) return 1;
          
          // Then sort by accepted status
          if (a.isAccepted !== b.isAccepted) {
            return b.isAccepted ? 1 : -1;
          }
          
          // Finally, sort alphabetically
          return a.insurancePlan.name.localeCompare(b.insurancePlan.name);
        });
        
        setInsuranceAcceptances(sortedAcceptances);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptanceChange = async (acceptance: InsuranceAcceptance, isAccepted: boolean) => {
    const planId = acceptance.insurancePlan.id;
    
    // Optimistic update - immediately update the UI
    setInsuranceAcceptances(insuranceAcceptances.map(ia => 
      ia.insurancePlan.id === planId
        ? { ...ia, isAccepted }
        : ia
    ));
    
    // Set loading state for this specific insurance plan
    setSavingStates(prev => ({ ...prev, [planId]: true }));
    
    try {
      const response = await fetch(`/api/doctors/${doctorId}/insurances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insurancePlanId: planId,
          isAccepted,
          useCustomFeeSchedule: false,
          coversFreeExam: acceptance.coversFreeExam,
        }),
      });

      if (!response.ok) {
        // Revert the optimistic update if the API call failed
        setInsuranceAcceptances(insuranceAcceptances.map(ia => 
          ia.insurancePlan.id === planId
            ? { ...ia, isAccepted: !isAccepted }
            : ia
        ));
        console.error('Error updating acceptance: API call failed');
      }
    } catch (error) {
      // Revert the optimistic update if the API call failed
      setInsuranceAcceptances(insuranceAcceptances.map(ia => 
        ia.insurancePlan.id === planId
          ? { ...ia, isAccepted: !isAccepted }
          : ia
      ));
      console.error('Error updating acceptance:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [planId]: false }));
    }
  };

  const handleFreeExamOverrideChange = async (acceptance: InsuranceAcceptance, coversFreeExam: boolean | null) => {
    const planId = acceptance.insurancePlan.id;
    
    // Optimistic update
    setInsuranceAcceptances(insuranceAcceptances.map(ia => 
      ia.insurancePlan.id === planId
        ? { ...ia, coversFreeExam }
        : ia
    ));
    
    setSavingStates(prev => ({ ...prev, [planId]: true }));
    
    try {
      const response = await fetch(`/api/doctors/${doctorId}/insurances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insurancePlanId: planId,
          isAccepted: acceptance.isAccepted,
          useCustomFeeSchedule: acceptance.useCustomFeeSchedule,
          coversFreeExam,
          customFees: acceptance.customFees,
        }),
      });

      if (!response.ok) {
        // Revert on failure
        setInsuranceAcceptances(insuranceAcceptances.map(ia => 
          ia.insurancePlan.id === planId
            ? { ...ia, coversFreeExam: acceptance.coversFreeExam }
            : ia
        ));
        console.error('Error updating free exam override');
      }
    } catch (error) {
      // Revert on failure
      setInsuranceAcceptances(insuranceAcceptances.map(ia => 
        ia.insurancePlan.id === planId
          ? { ...ia, coversFreeExam: acceptance.coversFreeExam }
          : ia
      ));
      console.error('Error updating free exam override:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [planId]: false }));
    }
  };

  const openFeeScheduleDialog = async (acceptance: InsuranceAcceptance) => {
    setEditingInsurance(acceptance);
    
    // Fetch dynamic fee schedules using the same logic as code picker
    try {
      const response = await fetch(`/api/insurance-fee-schedules/dynamic?doctorId=${doctorId}&insurancePlanId=${acceptance.insurancePlan.id}`);
      const data = await response.json();
      if (response.ok) {
        setDefaultFees(data.feeSchedules);
        
        // Initialize custom fees with existing values or dynamic defaults
        const initialFees: Record<string, string> = {};
        if (acceptance.useCustomFeeSchedule && acceptance.customFees.length > 0) {
          acceptance.customFees.forEach(fee => {
            initialFees[fee.code] = (fee.amount / 100).toFixed(2);
          });
        } else {
          data.feeSchedules.forEach((fee: FeeSchedule) => {
            initialFees[fee.code] = (fee.amount / 100).toFixed(2);
          });
        }
        setCustomFees(initialFees);
      }
    } catch (error) {
      console.error('Error fetching dynamic fees:', error);
    }
    
    setFeeScheduleDialogOpen(true);
  };

  const saveFeeSchedule = async (useCustom: boolean) => {
    if (!editingInsurance) return;
    
    const planId = editingInsurance.insurancePlan.id;
    setSavingStates(prev => ({ ...prev, [planId]: true }));
    
    try {
      const customFeeData = useCustom 
        ? Object.entries(customFees).map(([code, amount]) => ({
            code,
            amount: Math.round(parseFloat(amount) * 100) // Convert to cents
          }))
        : [];

      const response = await fetch(`/api/doctors/${doctorId}/insurances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insurancePlanId: planId,
          isAccepted: true,
          useCustomFeeSchedule: useCustom,
          coversFreeExam: editingInsurance.coversFreeExam,
          customFees: customFeeData,
        }),
      });

      if (response.ok) {
        await fetchDoctorAndInsurances();
        setFeeScheduleDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving fee schedule:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [planId]: false }));
    }
  };

  const handleCreateCustomInsurance = async () => {
    if (!newInsuranceName.trim()) return;
    
    setSavingCustomInsurance(true);
    try {
      const response = await fetch('/api/insurances/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newInsuranceName.trim(),
          coversFreeExam: newInsuranceCoversFreeExam,
        }),
      });

      if (response.ok) {
        // Refresh the insurance list
        await fetchDoctorAndInsurances();
        setCustomInsuranceDialogOpen(false);
        setNewInsuranceName('');
        setNewInsuranceCoversFreeExam(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create custom insurance');
      }
    } catch (error) {
      console.error('Error creating custom insurance:', error);
      alert('Failed to create custom insurance');
    } finally {
      setSavingCustomInsurance(false);
    }
  };


  const handleDeleteCustomInsurance = async (insuranceId: number) => {
    if (!confirm('Are you sure you want to delete this custom insurance? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/insurances/custom?id=${insuranceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDoctorAndInsurances();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete custom insurance');
      }
    } catch (error) {
      console.error('Error deleting custom insurance:', error);
      alert('Failed to delete custom insurance');
    }
  };


  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading insurance information...</div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Doctor not found</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/doctors')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Doctors
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Acceptance for {doctor.name}</CardTitle>
          <CardDescription>
            Select which insurance plans this doctor accepts and configure fee schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => {
                setNewInsuranceName('');
                setNewInsuranceCoversFreeExam(false);
                setCustomInsuranceDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Insurance
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Accept</TableHead>
                <TableHead>Insurance Plan</TableHead>
                <TableHead>Free Exam Coverage</TableHead>
                <TableHead>Fee Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insuranceAcceptances.map((acceptance) => (
                <TableRow key={acceptance.insurancePlan.id}>
                  <TableCell>
                    <Checkbox
                      checked={acceptance.isAccepted}
                      onCheckedChange={(checked) => 
                        handleAcceptanceChange(acceptance, checked as boolean)
                      }
                      disabled={savingStates[acceptance.insurancePlan.id] || false}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {acceptance.insurancePlan.name}
                      {acceptance.insurancePlan.isCustom && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Custom</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {acceptance.isAccepted ? (
                      <select
                        className="text-sm border rounded px-3 py-1.5 bg-white"
                        value={acceptance.coversFreeExam === null ? 'default' : acceptance.coversFreeExam ? 'yes' : 'no'}
                        onChange={(e) => {
                          const value = e.target.value;
                          const newValue = value === 'default' ? null : value === 'yes';
                          handleFreeExamOverrideChange(acceptance, newValue);
                        }}
                        disabled={savingStates[acceptance.insurancePlan.id] || false}
                      >
                        <option value="default">Default ({acceptance.insurancePlan.coversFreeExam ? 'Yes' : 'No'})</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    ) : (
                      <span className="text-sm text-gray-400">
                        {acceptance.insurancePlan.coversFreeExam ? 'Yes' : 'No'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {acceptance.isAccepted && (
                      <span className={acceptance.useCustomFeeSchedule ? 'text-blue-600' : 'text-gray-600'}>
                        {acceptance.useCustomFeeSchedule ? 'Custom' : 'Default'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {acceptance.isAccepted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openFeeScheduleDialog(acceptance)}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Configure Fees
                        </Button>
                      )}
                      {acceptance.insurancePlan.isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCustomInsurance(acceptance.insurancePlan.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fee Schedule Dialog */}
      <Dialog open={feeScheduleDialogOpen} onOpenChange={setFeeScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Fee Schedule</DialogTitle>
            <DialogDescription>
              Set custom fee amounts for {editingInsurance?.insurancePlan.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-4 font-medium text-sm">
              <div>CPT Code</div>
              <div>Current Rate</div>
              <div>Custom Rate</div>
            </div>
            
            {CPT_CODES.map((code) => {
              const defaultFee = defaultFees.find(f => f.code === code);
              return (
                <div key={code} className="grid grid-cols-3 gap-4 items-center">
                  <div className="font-mono">{code}</div>
                  <div className="text-gray-600">
                    ${defaultFee ? (defaultFee.amount / 100).toFixed(2) : '0.00'}
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      value={customFees[code] || '0.00'}
                      onChange={(e) => setCustomFees({
                        ...customFees,
                        [code]: e.target.value
                      })}
                      className="w-24"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => saveFeeSchedule(false)}
              disabled={savingStates[editingInsurance?.insurancePlan.id || 0] || false}
            >
              Use Default Rates
            </Button>
            <Button
              onClick={() => saveFeeSchedule(true)}
              disabled={savingStates[editingInsurance?.insurancePlan.id || 0] || false}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Custom Rates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Insurance Dialog */}
      <Dialog open={customInsuranceDialogOpen} onOpenChange={setCustomInsuranceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Custom Insurance
            </DialogTitle>
            <DialogDescription>
              Create a custom insurance plan for your organization
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="insurance-name">Insurance Name</Label>
              <Input
                id="insurance-name"
                value={newInsuranceName}
                onChange={(e) => setNewInsuranceName(e.target.value)}
                placeholder="Enter insurance name"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="covers-free-exam"
                checked={newInsuranceCoversFreeExam}
                onCheckedChange={(checked) => setNewInsuranceCoversFreeExam(checked as boolean)}
              />
              <Label htmlFor="covers-free-exam" className="font-normal">
                Covers free exam
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCustomInsuranceDialogOpen(false);
                setNewInsuranceName('');
                setNewInsuranceCoversFreeExam(false);
              }}
              disabled={savingCustomInsurance}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomInsurance}
              disabled={savingCustomInsurance || !newInsuranceName.trim()}
            >
              {savingCustomInsurance ? 'Saving...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}