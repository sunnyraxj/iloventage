
'use client';

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Category } from '@/lib/types';
import { Slider } from "@/components/ui/slider"

interface ProductFiltersProps {
    categories: Category[];
    genderFilter: string;
    onGenderChange: (value: string) => void;
    onCategoryChange: (categoryId: string, checked: boolean) => void;
    categoryFilters: string[];

    // New props
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
        <div className="space-y-6">
             <div>
                <h3 className="mb-4 font-medium">Price</h3>
                <Slider
                    value={[priceRange[1]]} // Controlled component for max price
                    max={maxPrice}
                    step={10}
                    onValueChange={(value) => onPriceChange([0, value[0]])}
                    className="mb-2"
                />
                 <div className="flex justify-between text-sm text-muted-foreground">
                    <span>₹0</span>
                    <span>₹{priceRange[1]}</span>
                </div>
            </div>
            <div>
                <h3 className="mb-4 font-medium">Gender</h3>
                <RadioGroup defaultValue="all" value={genderFilter} onValueChange={onGenderChange}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="gender-all-filter" />
                        <Label htmlFor="gender-all-filter">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="gender-male-filter" />
                        <Label htmlFor="gender-male-filter">Men</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="gender-female-filter" />
                        <Label htmlFor="gender-female-filter">Women</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unisex" id="gender-unisex-filter" />
                        <Label htmlFor="gender-unisex-filter">Unisex</Label>
                    </div>
                </RadioGroup>
            </div>
            <div>
                <h3 className="mb-4 font-medium">Category</h3>
                <div className="space-y-2">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`cat-filter-${cat.id}`}
                                onCheckedChange={(checked) => onCategoryChange(cat.id, checked as boolean)}
                                checked={categoryFilters.includes(cat.id)}
                            />
                            <Label htmlFor={`cat-filter-${cat.id}`}>{cat.name}</Label>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="mb-4 font-medium">Colors</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {colors.map(color => (
                        <div key={color} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`color-filter-${color}`}
                                onCheckedChange={(checked) => onColorChange(color, checked as boolean)}
                                checked={colorFilters.includes(color)}
                            />
                            <Label htmlFor={`color-filter-${color}`} className="capitalize">{color}</Label>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="mb-4 font-medium">Sizes</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {sizes.map(size => (
                        <div key={size} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`size-filter-${size}`}
                                onCheckedChange={(checked) => onSizeChange(size, checked as boolean)}
                                checked={sizeFilters.includes(size)}
                            />
                            <Label htmlFor={`size-filter-${size}`} className="uppercase">{size}</Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
