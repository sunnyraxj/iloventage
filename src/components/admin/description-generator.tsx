'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Wand2 } from 'lucide-react';
import { generateProductDescription } from '@/ai/flows/admin-generates-product-description-flow';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function DescriptionGenerator({ form }: { form: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateDescription = async () => {
    setIsLoading(true);
    const { name, category, keywords } = form.getValues();

    if (!name || !category) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a product name and category first.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const description = await generateProductDescription({
        productName: name,
        category: category,
        keywords: keywords ? keywords.split(',').map((k: string) => k.trim()) : [],
      });
      form.setValue('description', description);
      toast({
        title: 'Description Generated!',
        description: 'The AI-generated description has been filled in.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate a description. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-secondary">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Wand2 className="text-primary"/>
                AI Description Assistant
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Keywords</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. stylish, comfortable, durable" {...field} />
                </FormControl>
                <FormDescription>
                    Provide comma-separated keywords to guide the AI.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button
            type="button"
            onClick={handleGenerateDescription}
            disabled={isLoading}
            >
            {isLoading ? 'Generating...' : 'Generate with AI'}
            </Button>
        </CardContent>
    </Card>
  );
}
