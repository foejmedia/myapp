import { notFound } from 'next/navigation';
import BookDetail from '@/components/books/BookDetail';
import { isLang } from '@/lib/books/catalog';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> };

export default async function BookPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { lang } = await searchParams;
  if (!/^\d{1,10}$/.test(id)) notFound();
  return <BookDetail id={Number(id)} lang={isLang(lang) ? lang : 'en'} />;
}
