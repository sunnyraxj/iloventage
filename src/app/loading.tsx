import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="flex-1">
      <section className="relative h-[60vh] w-full overflow-hidden rounded-b-2xl">
          <Skeleton className="h-full w-full" />
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-4 gap-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 md:py-20">
        <div className="container mx-auto px-4">
           <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                 <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                      <Skeleton className="h-4 w-1/4 mt-2" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-1/2" />
                  </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
