import React from 'react';
import { Search, Filter, ChevronDown, MoreHorizontal } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, icon }) => (
  <div className="bg-red-800 rounded-lg p-6 text-white">
    <div className="flex items-center justify-between mb-2">
      <span className="text-red-200 text-sm">{title}</span>
      <div className="text-red-200">{icon}</div>
    </div>
    <div className="text-2xl font-bold mb-2">{value}</div>
    <div className="flex items-center text-sm">
      <span className={`mr-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '↗' : '↘'}
      </span>
      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
        {change} This Month
      </span>
    </div>
  </div>
);

const SalesChart: React.FC = () => {
  const data = [
    { day: 'Sun', value: 320, color: 'bg-orange-500' },
    { day: 'Mon', value: 350, color: 'bg-white' },
    { day: 'Tue', value: 370, color: 'bg-white' },
    { day: 'Wed', value: 200, color: 'bg-orange-500' },
    { day: 'Thu', value: 100, color: 'bg-orange-500' },
    { day: 'Fri', value: 380, color: 'bg-white' },
    { day: 'Sat', value: 350, color: 'bg-orange-500' },
  ];

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-red-800 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">Sales Report</h3>
          <p className="text-red-200 text-sm">Your Weekly Statistics Reports</p>
        </div>
        <div className="flex space-x-2">
          {['1d', '7d', '30d', '16m', 'Max'].map((period, index) => (
            <button
              key={period}
              className={`px-3 py-1 rounded text-sm ${
                index === 2 ? 'bg-white text-red-800' : 'bg-red-700 text-white hover:bg-red-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-end justify-between h-48 mt-8">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-12 ${item.color} rounded-t`}
              style={{ height: `${(item.value / maxValue) * 160}px` }}
            />
            <span className="text-red-200 text-sm mt-2">{item.day}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-red-200 text-sm mt-4">
        <span>$0</span>
        <span>$100K</span>
        <span>$200K</span>
        <span>$300K</span>
        <span>$400K</span>
      </div>
    </div>
  );
};

const DonutChart: React.FC = () => {
  return (
    <div className="bg-red-800 rounded-lg p-6 text-white">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1">Analytical Performance</h3>
        <p className="text-red-200 text-sm">Your Monthly Performance Data</p>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#dc2626"
              strokeWidth="20"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#0891b2"
              strokeWidth="20"
              strokeDasharray="201.06 301.59"
              strokeDashoffset="0"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="20"
              strokeDasharray="120.64 381.01"
              strokeDashoffset="-201.06"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#ea580c"
              strokeWidth="20"
              strokeDasharray="80.42 421.23"
              strokeDashoffset="-321.7"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">1,154</div>
              <div className="text-sm text-red-200">Orders</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-cyan-600 rounded-full mr-3"></div>
            <span className="text-white">Total Paid</span>
          </div>
          <div className="flex items-center">
            <span className="text-white mr-2">40%</span>
            <span className="text-cyan-400 font-bold">400</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
            <span className="text-white">Total Overdue</span>
          </div>
          <div className="flex items-center">
            <span className="text-white mr-2">36%</span>
            <span className="text-yellow-500 font-bold">360</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-600 rounded-full mr-3"></div>
            <span className="text-white">Total Unpaid</span>
          </div>
          <div className="flex items-center">
            <span className="text-white mr-2">24%</span>
            <span className="text-orange-600 font-bold">240</span>
          </div>
        </div>
      </div>
      <button className="w-full mt-4 text-white border border-red-600 rounded-lg py-2 hover:bg-red-700 transition-colors">
        See More Complete Data
      </button>
    </div>
  );
};

const OrderHistory: React.FC = () => {
  const orders = [
    {
      product: 'Product Abc',
      date: '16 July 2025',
      time: '10:30 AM',
      orderNo: '#LJHKNI23468',
      customer: 'Mariana Girgantui',
      initial: 'M',
      price: '$550',
      status: 'Success',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      product: 'Product Abc',
      date: '19 July 2025',
      time: '6:10 AM',
      orderNo: '#LJHKNI23468',
      customer: 'Christ Evandro',
      initial: 'C',
      price: '$550',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      product: 'Product Abc',
      date: '16 July 2025',
      time: '10:30 AM',
      orderNo: '#LJHKNI23468',
      customer: 'Mariana Girgantui',
      initial: 'M',
      price: '$550',
      status: 'Success',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      product: 'Product Abc',
      date: '19 July 2025',
      time: '6:10 AM',
      orderNo: '#LJHKNI23468',
      customer: 'Christ Evandro',
      initial: 'C',
      price: '$550',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
  ];

  return (
    <div className="bg-red-800 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Order History</h3>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-300" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-red-700 text-white placeholder-red-300 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button className="bg-red-700 p-2 rounded-lg hover:bg-red-600 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-red-600">
              <th className="pb-3 text-red-200 font-medium">
                Product <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="pb-3 text-red-200 font-medium">
                Date <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="pb-3 text-red-200 font-medium">
                Order No <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="pb-3 text-red-200 font-medium">
                Customer name <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="pb-3 text-red-200 font-medium">
                Price <ChevronDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="pb-3 text-red-200 font-medium">Status</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index} className="border-b border-red-700">
                <td className="py-4 text-white">{order.product}</td>
                <td className="py-4">
                  <div className="text-white">{order.date}</div>
                  <div className="text-red-300 text-sm">{order.time}</div>
                </td>
                <td className="py-4 text-white">{order.orderNo}</td>
                <td className="py-4">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${order.initial === 'M' ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center text-white text-sm font-bold mr-3`}>
                      {order.initial}
                    </div>
                    <span className="text-white">{order.customer}</span>
                  </div>
                </td>
                <td className="py-4 text-white">{order.price}</td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${order.statusColor}`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-4">
                  <button className="text-red-300 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Conversion: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Revenue"
            value="$5467.46"
            change="+31%"
            isPositive={true}
            icon={<div className="w-5 h-5 bg-red-700 rounded"></div>}
          />
          <MetricCard
            title="Visitor"
            value="12,235"
            change="-21%"
            isPositive={false}
            icon={<div className="w-5 h-5 bg-red-700 rounded-full"></div>}
          />
          <MetricCard
            title="Total Order"
            value="5,903"
            change="-21%"
            isPositive={false}
            icon={<div className="w-5 h-5 bg-red-700 rounded"></div>}
          />
          <MetricCard
            title="Total Customer"
            value="2521"
            change="+2.7%"
            isPositive={true}
            icon={<div className="w-5 h-5 bg-red-700 rounded"></div>}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SalesChart />
          <DonutChart />
        </div>

        {/* Order History */}
        <OrderHistory />
      </div>
    </div>
  );
};

export default Conversion;