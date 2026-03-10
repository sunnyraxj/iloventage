'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SalesData {
    name: string;
    revenue: number;
}

interface ProductSalesChartProps {
    data: SalesData[];
}

export function ProductSalesChart({ data }: ProductSalesChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Revenue from top 5 products for the selected month.</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                stroke="hsl(var(--foreground))" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                width={150}
                                dx={-5}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--secondary))' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Product
                                                        </span>
                                                        <span className="font-bold text-muted-foreground">
                                                            {payload[0].payload.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Revenue
                                                        </span>
                                                        <span className="font-bold">
                                                        ₹{payload[0].value?.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                        No sales data for this period.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
