import { Skeleton } from '@/components/ui/skeleton';

export default function ProductLoading() {
    return (
        <main className="flex-1 bg-secondary">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 gap-8 rounded-lg bg-background p-4 shadow-sm md:grid-cols-5 md:gap-12 md:p-8">
                    {/* Image Gallery */}
                    <div className="grid grid-cols-1 gap-4 md:col-span-3">
                        <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                        <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="aspect-[3/4] w-full rounded-md" />
                            ))}
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col space-y-6 md:col-span-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                        <div className="flex items-baseline gap-2">
                           <Skeleton className="h-8 w-24" />
                           <Skeleton className="h-6 w-20" />
                        </div>
                        
                        {/* Color Selector */}
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-20" />
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-8 w-8 rounded-full" />
                                ))}
                            </div>
                        </div>

                        {/* Size Selector */}
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-20" />
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-9 w-12" />
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-10 w-28" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </div>

                         <div className="w-full mt-2 space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                </div>
            </div>

            <section className="bg-background py-12 md:py-20">
              <div className="container mx-auto px-4">
                <Skeleton className="h-8 w-48 mb-8" />
                <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
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
