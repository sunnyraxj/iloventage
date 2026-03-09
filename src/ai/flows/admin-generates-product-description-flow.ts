'use server';
/**
 * @fileOverview An AI assistant for generating product descriptions.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product.'),
  keywords: z
    .array(z.string())
    .describe('A list of keywords or features related to the product.'),
});
export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

const GenerateProductDescriptionOutputSchema = z
  .string()
  .describe('A compelling product description.');
export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return adminGeneratesProductDescriptionFlow(input);
}

const productDescriptionPrompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert copywriter tasked with creating a compelling product description for an e-commerce website. Your goal is to write a description that is engaging, informative, and persuasive, encouraging customers to purchase the product.

Product Name: {{{productName}}}
Category: {{{category}}}
Keywords/Features: {{{#each keywords}}}- {{{this}}}
{{{/each}}}

Craft a detailed product description that highlights the product's benefits, unique selling points, and evokes desire. The description should be professional and enthusiastic, without being overly promotional. Keep it concise, typically between 100-200 words.`,
});

const adminGeneratesProductDescriptionFlow = ai.defineFlow(
  {
    name: 'adminGeneratesProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await productDescriptionPrompt(input);
    return output!;
  }
);
