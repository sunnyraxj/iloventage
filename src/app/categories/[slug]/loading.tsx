import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
  return (
    <main className="flex-1 bg-secondary">
      <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mb-8 text-left">
            <Skeleton className="h-10 w-1/2 md:w-1/3" />
            <Skeleton className="h-4 w-3/4 md:w-1/2 mt-4" />
          </div>
          
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
    </main>
  );
}
