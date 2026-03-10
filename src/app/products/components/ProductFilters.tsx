'use client';

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Category } from '@/lib/types';

interface ProductFiltersProps {
    categories: Category[];
    genderFilter: string;
    onGenderChange: (value: string) => void;
    onCategoryChange: (categoryId: string, checked: boolean) => void;
    categoryFilters: string[];
}

export function ProductFilters({ categories, genderFilter, onGenderChange, onCategoryChange, categoryFilters }: ProductFiltersProps) {
    return (
        <div className="space-y-6">
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
        </div>
    );
}
