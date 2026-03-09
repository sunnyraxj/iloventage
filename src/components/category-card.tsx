import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card } from "@/components/ui/card";

interface CategoryCardProps {
    category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
    const categoryImage = PlaceHolderImages.find((img) => img.id === category.image);

    return (
        <Link href={`/categories/${category.slug}`} className="group block">
            <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                <div className="relative aspect-square">
                    {categoryImage && (
                        <Image
                            src={categoryImage.imageUrl}
                            alt={category.name}
                            data-ai-hint={categoryImage.imageHint}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    )}
                     <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/30" />
                </div>
                <div className="p-4">
                    <h3 className="text-center font-headline text-lg font-semibold">{category.name}</h3>
                </div>
            </Card>
        </Link>
    );
}
