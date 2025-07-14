'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { useActionState } from 'react';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { removeTeamMember, inviteTeamMember, updateTeamState, updateTeamName } from '@/app/(login)/actions';
import useSWR from 'swr';
import { Suspense, startTransition, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, MapPin, Building2 } from 'lucide-react';

type ActionState = {
  error?: string;
  success?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SubscriptionSkeleton() {
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>Team Subscription</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ManageSubscription() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: doctorsData } = useSWR('/api/doctors', fetcher);
  const [portalState, portalAction, isPortalPending] = useActionState<
    ActionState,
    FormData
  >(customerPortalAction, {});

  const doctorUsage = doctorsData?.usage || { current: 0, limit: teamData?.doctorLimit || 1 };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Team Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <p className="font-medium">
                Current Plan: {teamData?.planName || 'Free'}
              </p>
              <p className="text-sm text-muted-foreground">
                {teamData?.subscriptionStatus === 'active'
                  ? 'Billed monthly'
                  : teamData?.subscriptionStatus === 'trialing'
                  ? 'Trial period'
                  : 'No active subscription'}
              </p>
              {doctorUsage.limit > 0 ? (
                <div className="mt-2">
                  <p className="text-sm font-medium">
                    Doctors: {Math.min(doctorUsage.current, doctorUsage.limit)} of {doctorUsage.limit}
                  </p>
                  <div className="w-48 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((doctorUsage.current / doctorUsage.limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm font-medium text-amber-600">
                    Upgrade to add doctors
                  </p>
                </div>
              )}
            </div>
            <form action={portalAction}>
              <Button 
                type="submit" 
                variant="outline"
                disabled={isPortalPending}
              >
                {isPortalPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Manage Subscription'
                )}
              </Button>
            </form>
          </div>
          {portalState?.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{portalState.error}</p>
            </div>
          )}
          {portalState?.success && (
            <p className="text-green-600 text-sm">{portalState.success}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PracticeInformationSkeleton() {
  return (
    <Card className="mb-8 h-[160px]">
      <CardHeader>
        <CardTitle>Practice Information</CardTitle>
      </CardHeader>
    </Card>
  );
}

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

function PracticeInformation() {
  const { data: teamData, mutate } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [updateState, updateAction, isUpdatePending] = useActionState<
    ActionState,
    FormData
  >(updateTeamState, {});

  const handleStateChange = (newState: string) => {
    startTransition(() => {
      const formData = new FormData();
      formData.set('state', newState);
      updateAction(formData);
    });
  };

  // Revalidate when the action completes (pending goes from true to false)
  useEffect(() => {
    if (!isUpdatePending && updateState.success) {
      mutate();
    }
  }, [isUpdatePending, updateState.success, mutate]);

  const currentState = teamData?.state;
  const currentStateLabel = US_STATES.find(state => state.value === currentState)?.label;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Practice Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <Label htmlFor="state" className="text-sm font-medium">
                Practice State
              </Label>
              <p className="text-sm text-muted-foreground">
                Select your practice's state for accurate insurance reimbursement rates
              </p>
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={currentState || ''}
                onValueChange={handleStateChange}
                disabled={!isOwner || isUpdatePending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state">
                    {currentStateLabel || 'No state selected'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {updateState?.error && (
            <p className="text-red-500 text-sm">{updateState.error}</p>
          )}
          {updateState?.success && (
            <p className="text-green-500 text-sm">{updateState.success}</p>
          )}
          {!isOwner && (
            <p className="text-sm text-muted-foreground">
              Only practice owners can update practice settings.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PracticeNameSkeleton() {
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>Practice Details</CardTitle>
      </CardHeader>
    </Card>
  );
}

function PracticeName() {
  const { data: teamData, mutate } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [updateState, updateAction, isUpdatePending] = useActionState<
    ActionState,
    FormData
  >(updateTeamName, {});

  // Revalidate when the action completes
  useEffect(() => {
    if (!isUpdatePending && updateState.success) {
      mutate();
    }
  }, [isUpdatePending, updateState.success, mutate]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Practice Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={(formData) => startTransition(() => updateAction(formData))} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Practice Name
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Add a name for your practice (optional)
            </p>
            <div className="flex gap-2">
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter practice name"
                defaultValue={teamData?.name || ''}
                disabled={!isOwner}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!isOwner || isUpdatePending}
                variant="outline"
              >
                {isUpdatePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
          {updateState?.error && (
            <p className="text-red-500 text-sm">{updateState.error}</p>
          )}
          {updateState?.success && (
            <p className="text-green-500 text-sm">{updateState.success}</p>
          )}
          {!isOwner && (
            <p className="text-sm text-muted-foreground">
              Only practice owners can update practice details.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function TeamMembersSkeleton() {
  return (
    <Card className="mb-8 h-[300px]">
      <CardHeader>
        <CardTitle>Practice Staff</CardTitle>
      </CardHeader>
    </Card>
  );
}

function TeamMembers() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeTeamMember, {});

  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || 'Unknown User';
  };

  if (!teamData?.teamMembers?.length) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Practice Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No practice staff added yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Practice Staff</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {teamData.teamMembers.map((member, index) => (
            <li key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {getUserDisplayName(member.user)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {getUserDisplayName(member.user)}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {member.role === 'owner' ? 'Practice Owner' : 'Staff Member'}
                  </p>
                </div>
              </div>
              {index > 1 ? (
                <form action={removeAction}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={isRemovePending}
                  >
                    {isRemovePending ? 'Removing...' : 'Remove'}
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
        {removeState?.error && (
          <p className="text-red-500 mt-4">{removeState.error}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InviteTeamMemberSkeleton() {
  return (
    <Card className="h-[260px]">
      <CardHeader>
        <CardTitle>Invite Staff Member</CardTitle>
      </CardHeader>
    </Card>
  );
}

function InviteTeamMember() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOwner = user?.role === 'owner';
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Staff Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={inviteAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter staff member's email"
              required
              disabled={!isOwner}
            />
          </div>
          <div>
            <Label>Role</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={!isOwner}
            >
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member">Staff Member</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner">Practice Owner</Label>
              </div>
            </RadioGroup>
          </div>
          {inviteState?.error && (
            <p className="text-red-500">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-green-500">{inviteState.success}</p>
          )}
          <Button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700 text-white"
            disabled={isInvitePending || !isOwner}
          >
            {isInvitePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite Staff Member
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isOwner && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            You must be a practice owner to invite new staff members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Practice Management</h1>
      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>
      <Suspense fallback={<PracticeNameSkeleton />}>
        <PracticeName />
      </Suspense>
      <Suspense fallback={<PracticeInformationSkeleton />}>
        <PracticeInformation />
      </Suspense>
      <Suspense fallback={<TeamMembersSkeleton />}>
        <TeamMembers />
      </Suspense>
      <Suspense fallback={<InviteTeamMemberSkeleton />}>
        <InviteTeamMember />
      </Suspense>
    </section>
  );
}
