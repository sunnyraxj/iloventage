'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SalesData {
    name: string;
    revenue: number;
    quantity: number;
}

interface ProductSalesChartProps {
    data: SalesData[];
    months: { value: string; label: string; }[];
    selectedMonth: string;
    onMonthChange: (value: string) => void;
}

export function ProductSalesChart({ data, months, selectedMonth, onMonthChange }: ProductSalesChartProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>Top 10 products by revenue.</CardDescription>
                </div>
                 <Select value={selectedMonth} onValueChange={onMonthChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(month => (
                            <SelectItem key={month.value} value={month.value}>
                                {month.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Product
                                                        </span>
                                                        <span className="font-bold text-muted-foreground">
                                                            {payload[0].payload.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Revenue
                                                            </span>
                                                            <span className="font-bold">
                                                            ₹{payload[0].value?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Qty Sold
                                                            </span>
                                                            <span className="font-bold">
                                                                {payload[0].payload.quantity}
                                                            </span>
                                                        </div>
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
