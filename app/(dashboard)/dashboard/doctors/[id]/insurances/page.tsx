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
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import type { Doctor, InsurancePlan } from '@/lib/db/schema';

interface InsuranceAcceptance {
  insurancePlan: InsurancePlan;
  isAccepted: boolean;
  useCustomFeeSchedule: boolean;
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
  const [saving, setSaving] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsuranceAcceptance | null>(null);
  const [feeScheduleDialogOpen, setFeeScheduleDialogOpen] = useState(false);
  const [defaultFees, setDefaultFees] = useState<FeeSchedule[]>([]);
  const [customFees, setCustomFees] = useState<Record<string, string>>({});

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
        setInsuranceAcceptances(insuranceData.insuranceAcceptances);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptanceChange = async (acceptance: InsuranceAcceptance, isAccepted: boolean) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/doctors/${doctorId}/insurances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insurancePlanId: acceptance.insurancePlan.id,
          isAccepted,
          useCustomFeeSchedule: false,
        }),
      });

      if (response.ok) {
        setInsuranceAcceptances(insuranceAcceptances.map(ia => 
          ia.insurancePlan.id === acceptance.insurancePlan.id
            ? { ...ia, isAccepted }
            : ia
        ));
      }
    } catch (error) {
      console.error('Error updating acceptance:', error);
    } finally {
      setSaving(false);
    }
  };

  const openFeeScheduleDialog = async (acceptance: InsuranceAcceptance) => {
    setEditingInsurance(acceptance);
    
    // Fetch default fee schedules
    try {
      const response = await fetch(`/api/insurance-fee-schedules?insurancePlanId=${acceptance.insurancePlan.id}`);
      const data = await response.json();
      if (response.ok) {
        setDefaultFees(data.feeSchedules);
        
        // Initialize custom fees with existing values or defaults
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
      console.error('Error fetching default fees:', error);
    }
    
    setFeeScheduleDialogOpen(true);
  };

  const saveFeeSchedule = async (useCustom: boolean) => {
    if (!editingInsurance) return;
    
    setSaving(true);
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
          insurancePlanId: editingInsurance.insurancePlan.id,
          isAccepted: true,
          useCustomFeeSchedule: useCustom,
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
      setSaving(false);
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
                      disabled={saving}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {acceptance.insurancePlan.name}
                  </TableCell>
                  <TableCell>
                    {acceptance.insurancePlan.coversFreeExam ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell>
                    {acceptance.isAccepted && (
                      <span className={acceptance.useCustomFeeSchedule ? 'text-blue-600' : 'text-gray-600'}>
                        {acceptance.useCustomFeeSchedule ? 'Custom' : 'Default'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
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
              <div>Default Rate</div>
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
              disabled={saving}
            >
              Use Default Rates
            </Button>
            <Button
              onClick={() => saveFeeSchedule(true)}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Custom Rates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}