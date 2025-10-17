'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, GraduationCap, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { User } from '@/lib/db/schema';
import DemoCodePicker from '@/components/demo-code-picker';

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
    <main className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
      
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <h1 className="text-5xl font-light text-gray-900 tracking-tight sm:text-6xl">
                92 or 99?
                <span className="block font-normal text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                  Eye Code or E&M?
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Stop guessing. We tell you which code pays more for every insurance.
              </p>
              
              <div className="mt-10">
                <a href="/sign-up">
                  <Button
                    size="lg"
                    className="px-8 py-6 text-base font-medium rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Start Increasing Profits Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="mt-16 lg:mt-0 lg:col-span-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-3xl blur-3xl opacity-20" />
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                        E&M VS Eye Code
                      </div>
                      <p className="mt-2 text-gray-600">Auto-ranked by fee schedule</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-3xl font-semibold text-gray-900">5%</div>
                        <p className="text-sm text-gray-600 mt-1">Exam revenue lift</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-semibold text-gray-900">2min</div>
                        <p className="text-sm text-gray-600 mt-1">Per claim saved</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Code Picker Section */}
      <section className="relative py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="absolute inset-0 bg-grid-gray-100/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light text-gray-900 mb-3">
              Try It Now
              <span className="block font-normal text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                See it in action
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience how our tool automatically selects the highest-value CPT code based on insurance fee schedules.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-3xl blur-3xl opacity-15" />
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-6 md:p-10">
              <DemoCodePicker />
            </div>
          </div>

          <div className="text-center mt-10">
            <a href="/sign-up">
              <Button
                size="lg"
                className="px-8 py-6 text-base font-medium rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Using With Your Practice Data
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900">
              The right code, right away
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Rules-based workflow that boosts revenue and speeds billing
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-teal-200 transition-all duration-300">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-600 mb-6">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Capture thousands Annually
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Average practice captures thousands in year one by always billing the higher-paying code (92 vs 99). Most see results in the first week.
                </p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-teal-200 transition-all duration-300">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-600 mb-6">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Zero Fee Schedule Memorization
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Your staff doesn't need to know which insurance pays more for eye codes (92xxx) vs E&M codes (99xxx). Answer a few simple questions—we instantly show the winner.
                </p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 hover:border-teal-200 transition-all duration-300">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-600 mb-6">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  Same Work. Higher Pay.
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You're already doing comprehensive exams. Stop accepting lower reimbursement when the same visit qualifies for a higher-paying code family.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="absolute inset-0 bg-grid-gray-100/30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-12 shadow-xl border border-gray-100">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Stop Leaving Money on the Table
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join practices achieving 5% average revenue lift with zero additional effort
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/sign-up">
                <Button
                  size="lg"
                  className="px-8 py-6 text-base font-medium rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Start Increasing Profits Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Setup in 5 minutes • Cancel anytime
            </p>
            <p className="mt-4 text-xs text-gray-400">
              © {new Date().getFullYear()} EyeCodePro. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
