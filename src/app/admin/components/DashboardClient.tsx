'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Package, ShoppingBag, Users } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import type { Product, Order, User } from '@/lib/types';
import { ProductSalesChart } from './ProductSalesChart';

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

    const filteredOrders = useMemo(() => {
        return allOrders.filter(order => {
            const orderMonth = format(new Date(order.createdAt), 'yyyy-MM');
            return ['confirmed', 'shipped', 'delivered'].includes(order.orderStatus) && orderMonth === selectedMonth;
        });
    }, [allOrders, selectedMonth]);

    const totalRevenue = useMemo(() => {
        return filteredOrders.reduce((acc, order) => acc + order.total, 0);
    }, [filteredOrders]);

    const totalConfirmedOrders = allOrders.filter(order => order.orderStatus === 'confirmed').length;
    const totalProducts = products.length;
    const totalCustomers = users.filter(u => u.role === 'customer').length;
    
    const productSalesData = useMemo(() => {
        const sales: { [key: string]: { name: string, revenue: number, quantity: number } } = {};

        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    if (!sales[product.id]) {
                        sales[product.id] = { 
                            name: product.name.length > 30 ? `${product.name.substring(0, 30)}...` : product.name, 
                            revenue: 0,
                            quantity: 0
                        };
                    }
                    sales[product.id].revenue += item.price * item.quantity;
                    sales[product.id].quantity += item.quantity;
                }
            });
        });

        return Object.values(sales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    }, [filteredOrders, products]);
    
    const selectedMonthLabel = useMemo(() => {
        return months.find(m => m.value === selectedMonth)?.label;
    }, [selectedMonth, months]);

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">For {selectedMonthLabel}</p>
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
            <div className="grid gap-4 grid-cols-1">
                <ProductSalesChart 
                    data={productSalesData} 
                    months={months}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                />
            </div>
        </div>
    );
}
