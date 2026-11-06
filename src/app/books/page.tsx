import { Suspense } from 'react';
import BookStore from '@/components/books/BookStore';

export default function BooksPage() {
  return (
    <Suspense fallback={null}>
      <BookStore />
    </Suspense>
  );
}
