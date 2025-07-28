'use client';

import { useState, useActionState, useEffect, useTransition, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, Building2, MapPin } from 'lucide-react';
import { updateTeamName, updateTeamState } from '@/app/(login)/actions';
import { redirect } from 'next/navigation';
import useSWR from 'swr';
import { User as UserType, TeamDataWithMembers } from '@/lib/db/schema';

type ActionState = {
  error?: string;
  success?: string;
};

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [practiceName, setPracticeName] = useState('');
  const [state, setState] = useState(''); // No default state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);

  const [nameState, nameAction, isNamePending] = useActionState<
    ActionState,
    FormData
  >(updateTeamName, {});

  const [stateState, stateAction, isStatePending] = useActionState<
    ActionState,
    FormData
  >(updateTeamState, {});

  // If team already has a name, skip to step 2
  useEffect(() => {
    if (teamData?.name) {
      setPracticeName(teamData.name);
      setStep(2);
    }
  }, [teamData]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!practiceName.trim()) return;

    const formData = new FormData();
    formData.set('name', practiceName);

    startTransition(() => {
      nameAction(formData);
    });
  };

  // Move to step 2 when name action succeeds
  useEffect(() => {
    if (nameState.success) {
      setStep(2);
    }
  }, [nameState]);

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that a state is selected
    if (!state) {
      return;
    }
    
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set('state', state);

    startTransition(() => {
      stateAction(formData);
    });
  };

  // Redirect when state action succeeds
  useEffect(() => {
    if (stateState.success) {
      window.location.href = '/dashboard/doctors';
    }
  }, [stateState]);

  const handleSkip = () => {
    window.location.href = '/dashboard/doctors';
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-grid-gray-100/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
      
      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-light text-gray-900">Welcome to your practice</h2>
          <p className="mt-2 text-base text-gray-600">Let's optimize your revenue in 2 minutes</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
              step >= 1 ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'
            } transition-all duration-300`}>
              1
            </div>
            <div className={`w-24 h-0.5 ${step >= 2 ? 'bg-gradient-to-r from-teal-600 to-cyan-600' : 'bg-gray-200'} transition-all duration-300`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
              step >= 2 ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg' : 'bg-gray-200 text-gray-400'
            } transition-all duration-300`}>
              2
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-600 mb-4">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Practice Information
              </h3>
              <p className="text-gray-600">
                What's the name of your practice?
              </p>
            </div>
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div>
                  <Label htmlFor="practiceName">Practice Name</Label>
                  <Input
                    id="practiceName"
                    type="text"
                    value={practiceName}
                    onChange={(e) => setPracticeName(e.target.value)}
                    placeholder="Enter your practice name"
                    required
                    className="mt-2 rounded-xl border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={!practiceName.trim() || isNamePending}
                  >
                    {isNamePending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    className="rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    Skip
                  </Button>
                </div>
              </form>
          </div>
        )}

        {step === 2 && (
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-600 mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Practice Location
              </h3>
              <p className="text-gray-600">
                Select your state for accurate reimbursement rates
              </p>
            </div>
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div>
                  <Label htmlFor="state">Practice State</Label>
                  <Select
                    value={state}
                    onValueChange={setState}
                    required
                  >
                    <SelectTrigger className="mt-2 rounded-xl border-gray-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isSubmitting || isStatePending}
                >
                  {isSubmitting || isStatePending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
          </div>
        )}
      </div>
    </div>
  );
}