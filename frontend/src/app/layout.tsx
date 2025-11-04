<<<<<<< HEAD
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
=======
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { Providers } from './providers';
// Temporarily disabled for debugging
// import { BackendStatus } from '@/components/BackendStatus';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Georgian Distribution System",
  description: "B2B Food Distribution Platform for Georgia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            {children}
            {/* <BackendStatus /> */}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
>>>>>>> 4f46816d3369e63516557dedd905a7027f3ba306
