'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Settings, Shield, Activity, Menu, FileText, ChevronDown, ChevronRight } from 'lucide-react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { href: '/dashboard/code-picker', icon: FileText, label: 'Code Picker' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { 
      href: '/dashboard/general', 
      icon: Settings, 
      label: 'Settings',
      subItems: [
        { href: '/dashboard', icon: Users, label: 'Practice' },
        { href: '/dashboard/security', icon: Shield, label: 'Security' },
      ]
    },
  ];

  // Check if settings section should be expanded based on current path
  const shouldExpandSettings = pathname === '/dashboard' || pathname === '/dashboard/security' || pathname === '/dashboard/general';

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <span className="font-medium">Practice Dashboard</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="lg:hidden bg-white border-r border-gray-200 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            if (item.subItems) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      shouldExpandSettings ? 'bg-teal-100 text-teal-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                    {isSettingsOpen || shouldExpandSettings ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  {(isSettingsOpen || shouldExpandSettings) && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isSubActive
                                ? 'bg-teal-100 text-teal-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            onClick={() => setIsSidebarOpen(false)}
                          >
                            <SubIcon className="mr-3 h-4 w-4" />
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'bg-teal-100 text-teal-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:flex-grow">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 px-4 py-8">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              if (item.subItems) {
                return (
                  <div key={item.href}>
                    <button
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        shouldExpandSettings ? 'bg-teal-100 text-teal-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                      {isSettingsOpen || shouldExpandSettings ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </button>
                    {(isSettingsOpen || shouldExpandSettings) && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isSubActive
                                  ? 'bg-teal-100 text-teal-700'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <SubIcon className="mr-3 h-4 w-4" />
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                      ? 'bg-teal-100 text-teal-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>

      {/* Mobile main content */}
      <main className="lg:hidden flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
