'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
          <CardDescription>
            We encountered an error while loading your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Error details:</p>
            <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
          {error.message?.includes('subscription') && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                If you're having issues with your subscription, you can try:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 mt-2">
                <li>Refreshing the page</li>
                <li>Logging out and back in</li>
                <li>Contacting support if the issue persists</li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard
          </Button>
          <Button onClick={reset}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}