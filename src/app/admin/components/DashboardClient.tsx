'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Package, ShoppingBag, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subMonths } from 'date-fns';
import type { Product, Order, User } from '@/lib/types';

interface DashboardClientProps {
    products: Product[];
    allOrders: Order[];
    users: User[];
}

export function DashboardClient({ products, allOrders, users }: DashboardClientProps) {
    const months = useMemo(() => {
        const monthOptions = [];
        const today = new Date();
        for (let i = 0; i < 6; i++) {
            const date = subMonths(today, i);
            monthOptions.push({
                value: format(date, 'yyyy-MM'),
                label: format(date, 'MMMM yyyy'),
            });
        }
        return monthOptions;
    }, []);
    
    const [selectedMonth, setSelectedMonth] = useState<string>(months[0].value);

    const totalRevenue = useMemo(() => {
        return allOrders
            .filter(order => {
                const orderMonth = format(new Date(order.createdAt), 'yyyy-MM');
                return ['confirmed', 'shipped', 'delivered'].includes(order.orderStatus) && orderMonth === selectedMonth;
            })
            .reduce((acc, order) => acc + order.total, 0);
    }, [allOrders, selectedMonth]);

    const totalConfirmedOrders = allOrders.filter(order => order.orderStatus === 'confirmed').length;
    const totalProducts = products.length;
    const totalCustomers = users.filter(u => u.role === 'customer').length;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[150px] h-8 text-xs -translate-y-1">
                                <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(month => (
                                    <SelectItem key={month.value} value={month.value} className="text-xs">
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalConfirmedOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{totalCustomers}</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
