import { Suspense } from 'react';
import Dashboard from '@/learn1min/components/Dashboard';

export default function LearnDashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
