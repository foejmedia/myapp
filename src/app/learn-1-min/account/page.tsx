import type { Metadata } from 'next';
import AccountPage from '@/learn1min/components/AccountPage';

export const metadata: Metadata = { title: 'Account' };

export default function Page() {
  return <AccountPage />;
}
