import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AdminLayoutClient } from './layout-client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary">
        <AdminLayoutClient>
          {children}
        </AdminLayoutClient>
      </main>
      <Footer />
    </div>
  );
}
