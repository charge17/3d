import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hunyuan3D v4 ULTRA PRO',
  description: 'Free SaaS 3D Generation — AI-powered mesh & PBR textures',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen grid-bg">
        {children}
        <footer className="text-center py-6 text-[var(--text-secondary)] text-sm border-t border-[var(--border)]">
          Hunyuan3D v4 ULTRA PRO · Powered by AI · Free & Open Source
        </footer>
      </body>
    </html>
  );
}
