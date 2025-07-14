'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, Shield, DollarSign } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HomePage() {
  const { data: user, isLoading } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return null;
  }

  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Master Eye Care
                <span className="block text-[#198bc4]">Insurance Codes</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Streamline your ophthalmology or optometry practice with AI-powered insurance code selection. 
                Reduce claim denials, maximize reimbursements, and save hours of 
                administrative work with our sophisticated coding platform.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <a
                  href="/sign-up"
                >
                  <Button
                    size="lg"
                    className="text-lg rounded-full bg-[#198bc4] hover:bg-[#0f7ba8] text-white"
                  >
                    Sign Up
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="w-full rounded-lg shadow-lg overflow-hidden flex items-center justify-center">
                <img 
                  src="/dashboard-preview.png?v=1" 
                  alt="Dashboard Preview" 
                  className="w-3/4 h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#198bc4] text-white">
                <Eye className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Eye Care Expertise
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Specialized knowledge of eye care procedures and their corresponding 
                  insurance codes. Built by experts who understand ophthalmology and optometry practice needs.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#198bc4] text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Compliance & Accuracy
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Reduce claim denials with our comprehensive database of current 
                  codes and real-time validation for optimal reimbursement rates.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#198bc4] text-white">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Maximize Revenue
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Increase practice profitability by ensuring proper code selection 
                  and reducing administrative overhead. Save time and money.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to optimize your practice?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Join eye care professionals who trust CodeSelect to 
                streamline their coding process and maximize their revenue potential.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <a href="/pricing">
                <Button
                  size="lg"
                  className="text-lg rounded-full bg-[#198bc4] hover:bg-[#0f7ba8] text-white"
                >
                  Get Started Today
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
