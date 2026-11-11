import BooksComingSoon from '@/components/books/BooksComingSoon';

// The library (BookStore) is paused for now; this page shows a coming-soon message instead.
export default function BooksPage() {
  return (
    <BooksComingSoon
      kicker="Library"
      title="Our library is on its way"
      message="We're gathering free Islamic books to read online and download. The shelves aren't ready yet, in sha Allah they will be soon."
      primary={{ label: 'Read the Quran', href: '/read-quran' }}
      secondary={{ label: 'Back to home', href: '/' }}
    />
  );
}
