'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:!bg-gray-800 dark:!text-gray-100 dark:!border-gray-700',
          style: { borderRadius: '10px', fontSize: '14px' },
        }}
      />
      {children}
    </ThemeProvider>
  );
}
