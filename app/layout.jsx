import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Audio Micro-SaaS - Autonomous Audio Tools',
  description: 'AI-generated audio tools and video converters.',
};

function TopNav() {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between' }}>
      <Link href="/" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem', color: '#333' }}>
        AudioStudio SaaS
      </Link>
    </nav>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'sans-serif' }}>
        <TopNav />
        <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
