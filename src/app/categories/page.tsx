import { getCategories } from '@/lib/data';
import Link from 'next/link';

export const revalidate = 1800;

export default async function AllCategoriesPage() {
    const categories = await getCategories();

    return (
        <main className="flex-1 bg-secondary py-8 md:py-12">
            <div className="container mx-auto px-4">
                <div className="mb-8 text-left">
                    <h1 className="font-headline text-3xl font-bold md:text-4xl">
                        All Categories
                    </h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">
                        Browse our curated collections.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-8">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            className={'group block'}
                        >
                            <div className="overflow-hidden rounded-lg aspect-[3/4]">
                                <img
                                    src={category.imageUrl || `https://picsum.photos/seed/${category.id}/400/533`}
                                    alt={category.name}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                            </div>
                            <h3 className="mt-2 truncate font-semibold text-foreground">
                                {category.name}
                            </h3>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
