
'use client';

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Category } from '@/lib/types';
import { Slider } from "@/components/ui/slider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ProductFiltersProps {
    categories: Category[];
    genderFilter: string;
    onGenderChange: (value: string) => void;
    onCategoryChange: (categoryId: string, checked: boolean) => void;
    categoryFilters: string[];
    colors: string[];
    sizes: string[];
    priceRange: number[]; // [min, max]
    maxPrice: number;
    colorFilters: string[];
    sizeFilters: string[];
    onPriceChange: (value: number[]) => void;
    onColorChange: (color: string, checked: boolean) => void;
    onSizeChange: (size: string, checked: boolean) => void;
}

export function ProductFilters({
    categories,
    genderFilter,
    onGenderChange,
    onCategoryChange,
    categoryFilters,
    colors,
    sizes,
    priceRange,
    maxPrice,
    colorFilters,
    sizeFilters,
    onPriceChange,
    onColorChange,
    onSizeChange,
}: ProductFiltersProps) {
    return (
        <Accordion type="multiple" defaultValue={['price', 'categories']} className="w-full">
            <AccordionItem value="price">
                <AccordionTrigger className="text-sm font-medium">Price</AccordionTrigger>
                <AccordionContent>
                    <div className="pt-2">
                        <Slider
                            value={[priceRange[1]]}
                            max={maxPrice}
                            step={10}
                            onValueChange={(value) => onPriceChange([0, value[0]])}
                            className="mb-2"
                        />
                         <div className="flex justify-between text-xs text-muted-foreground">
                            <span>₹0</span>
                            <span>₹{priceRange[1]}</span>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="gender">
                <AccordionTrigger className="text-sm font-medium">Gender</AccordionTrigger>
                <AccordionContent>
                    <RadioGroup defaultValue="all" value={genderFilter} onValueChange={onGenderChange} className="space-y-2 pt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="gender-all-filter" />
                            <Label htmlFor="gender-all-filter" className="font-normal text-sm">All</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="gender-male-filter" />
                            <Label htmlFor="gender-male-filter" className="font-normal text-sm">Men</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="gender-female-filter" />
                            <Label htmlFor="gender-female-filter" className="font-normal text-sm">Women</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="unisex" id="gender-unisex-filter" />
                            <Label htmlFor="gender-unisex-filter" className="font-normal text-sm">Unisex</Label>
                        </div>
                    </RadioGroup>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="categories">
                <AccordionTrigger className="text-sm font-medium">Category</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-2 pt-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`cat-filter-${cat.id}`}
                                    onCheckedChange={(checked) => onCategoryChange(cat.id, checked as boolean)}
                                    checked={categoryFilters.includes(cat.id)}
                                />
                                <Label htmlFor={`cat-filter-${cat.id}`} className="font-normal text-sm">{cat.name}</Label>
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="colors">
                <AccordionTrigger className="text-sm font-medium">Colors</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-2 pt-2">
                        {colors.map(color => (
                            <div key={color} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`color-filter-${color}`}
                                    onCheckedChange={(checked) => onColorChange(color, checked as boolean)}
                                    checked={colorFilters.includes(color)}
                                />
                                <Label htmlFor={`color-filter-${color}`} className="capitalize font-normal text-sm">{color}</Label>
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
            
             <AccordionItem value="sizes">
                <AccordionTrigger className="text-sm font-medium">Sizes</AccordionTrigger>
                <AccordionContent>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                        {sizes.map(size => (
                            <div key={size} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`size-filter-${size}`}
                                    onCheckedChange={(checked) => onSizeChange(size, checked as boolean)}
                                    checked={sizeFilters.includes(size)}
                                />
                                <Label htmlFor={`size-filter-${size}`} className="uppercase font-normal text-sm">{size}</Label>
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
