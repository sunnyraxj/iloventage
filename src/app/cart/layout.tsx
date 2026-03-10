import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
