import './globals.css'; // If you have a global css file, otherwise optional
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '毅见倾新 · The Beginning of Us',
  description: 'Arrive as Strangers. Rise as One. 陌路而来，同心而聚。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0A] text-[#F5F5F7] antialiased selection:bg-[#D4AF37] selection:text-black">
        {children}
      </body>
    </html>
  );
};
