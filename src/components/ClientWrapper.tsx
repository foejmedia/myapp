'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { usePrefetch } from '@/hooks/usePrefetch';

/**
 * Wraps every page. The page is always rendered — on the server too — so search engines
 * and first-time visitors get the content straight away (no blocking loader, no blank HTML).
 * Moving between pages gets a short fade; the first page load is not animated.
 */
export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialize background prefetching
  usePrefetch();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="page-transition-wrapper"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
