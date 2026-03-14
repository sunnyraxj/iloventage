import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
  return (
    <main className="flex-1 bg-secondary py-8 md:py-12">
      <div className="container mx-auto px-4">
          <div className="mb-8 text-left">
            <Skeleton className="h-10 w-1/2 md:w-1/3" />
            <Skeleton className="h-4 w-3/4 md:w-1/2 mt-4" />
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <aside className="hidden md:block md:col-span-1">
                  <Skeleton className="h-[600px] w-full rounded-lg" />
              </aside>

              <div className="md:col-span-3">
                  <div className="flex items-center gap-4 mb-4">
                      <Skeleton className="h-10 w-28 md:hidden rounded-md" />
                      <Skeleton className="h-10 w-full rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
                      {Array.from({ length: 9 }).map((_, i) => (
                         <div key={i} className="space-y-2">
                              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                              <Skeleton className="h-4 w-1/4 mt-2" />
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-5 w-1/2" />
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </main>
  );
}
