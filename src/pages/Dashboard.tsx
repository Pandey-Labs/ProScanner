import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';

export function Dashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await fetch('/api/v1/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-8">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.totalRevenue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sales</CardTitle>
            <ShoppingBag className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalSales || 0}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +5.2% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Customers</CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +180 new this week
            </p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Invoice ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.recentSales?.map((sale: any) => (
                <tr key={sale._id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">#{sale._id}</td>
                  <td className="px-6 py-4">{new Date(sale.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4">{sale.products?.length || 0} items</td>
                  <td className="px-6 py-4 font-bold">${sale.grand_total?.toFixed(2)}</td>
                </tr>
              ))}
              {(!analytics?.recentSales || analytics.recentSales.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No recent transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
