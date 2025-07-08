import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertCircle } from 'lucide-react';
import { getBillingEntries } from '@/lib/db/queries';

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default async function ActivityPage() {
  const entries = await getBillingEntries();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Billing History
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Billing</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <ul className="space-y-4">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center space-x-4">
                  <div className="bg-teal-100 rounded-full p-2">
                    <DollarSign className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.recommendedCode} – {entry.insurancePlan} ({
                        entry.patientType
                      }{' '}
                      {entry.level})
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRelativeTime(new Date(entry.createdAt))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-teal-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No billing records yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                When you use the code picker, the results will appear here for quick reference.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
