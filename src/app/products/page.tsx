
import { getCategories } from '@/lib/data';
import { ProductsView } from './components/ProductsView';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ProductsViewSkeleton = () => (
    <main className="flex-1 bg-secondary py-8 md:py-12">
        <div className="container mx-auto px-4">
            <Skeleton className="h-10 w-1/3 mb-6" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                <aside className="hidden md:block md:col-span-1">
                    <Skeleton className="h-[600px] w-full" />
                </aside>
                <div className="md:col-span-3">
                    <div className="flex items-center gap-4 mb-4">
                        <Skeleton className="h-10 w-24 md:hidden" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                           <div key={i} className="space-y-2">
                                <Skeleton className="aspect-[3/4] w-full" />
                                <Skeleton className="h-4 w-1/4" />
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

export default async function ProductsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
    const categories = await getCategories();
    return (
        <Suspense fallback={<ProductsViewSkeleton />}>
            <ProductsView categories={categories} searchParams={searchParams} />
        </Suspense>
    );
}
