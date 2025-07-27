'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CircleIcon, Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );
  const [checkboxError, setCheckboxError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (mode === 'signup') {
      const formData = new FormData(e.currentTarget);
      const acceptTos = formData.get('acceptTos');
      
      if (!acceptTos) {
        e.preventDefault();
        setCheckboxError('Please check this box if you want to proceed');
        return;
      }
    }
    setCheckboxError(null);
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="absolute inset-0 bg-grid-gray-100/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 mb-6">
            <CircleIcon className="h-8 w-8 text-teal-600" />
          </div>
          <h2 className="text-3xl font-light text-gray-900">
            {mode === 'signin'
              ? 'Welcome back'
              : 'Create your account'}
          </h2>
          <p className="mt-2 text-base text-gray-600">
            {mode === 'signin'
              ? 'Sign in to access your coding platform'
              : 'Start capturing missed revenue today'}
          </p>
        </div>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 p-8">
          <form className="space-y-6" action={formAction} onSubmit={handleSubmit}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />
          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <Checkbox
                  id="acceptTos"
                  name="acceptTos"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500/20 border-gray-200 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <Label htmlFor="acceptTos" className="font-normal text-gray-700">
                  I agree to the{' '}
                  <Link
                    href="/terms-of-service"
                    target="_blank"
                    className="text-teal-600 hover:text-teal-500 underline"
                  >
                    Terms of Service
                  </Link>
                </Label>
              </div>
            </div>
          )}

          {checkboxError && mode === 'signup' && (
            <div className="text-red-500 text-sm ml-7">{checkboxError}</div>
          )}
          
          {state?.error && !state.error.includes('Terms of Service') && (
            <div className="text-red-500 text-sm">{state.error}</div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-6 rounded-xl text-base font-medium bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Loading...
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Sign up'
              )}
            </Button>
          </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">
                  {mode === 'signin'
                    ? 'New to the platform?'
                    : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                  redirect ? `?redirect=${redirect}` : ''
                }${priceId ? `&priceId=${priceId}` : ''}`}
                className="w-full flex justify-center py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white/50 hover:bg-gray-50 transition-all duration-200"
              >
                {mode === 'signin'
                  ? 'Create an account'
                  : 'Sign in to existing account'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
