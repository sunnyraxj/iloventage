
import { getAllProducts, getAllOrders, getAllUsers } from '@/lib/data';
import { DashboardClient } from './components/DashboardClient';

export default async function AdminDashboardPage() {
    const [products, allOrders, users] = await Promise.all([
        getAllProducts(),
        getAllOrders(),
        getAllUsers()
    ]);

    return (
      <DashboardClient products={products} allOrders={allOrders} users={users} />
    );
}
