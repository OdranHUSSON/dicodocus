import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ChakraProvider } from '@chakra-ui/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dicodocus - AI-Powered Docusaurus Editor',
  description: 'Revolutionize your Docusaurus documentation with AI-powered content generation, translations, and media management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ChakraProvider>
            {children}
        </ChakraProvider>
      </body>
    </html>
  );
}