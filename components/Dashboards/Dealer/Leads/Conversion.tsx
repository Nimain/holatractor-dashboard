"use client"

import React from 'react';
import { Search, Filter, ChevronDown, MoreHorizontal, TrendingUp, DollarSign } from 'lucide-react';
import { useDealerLanguage } from "@/context/DealerLanguageContext";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, icon }) => {
  const { t } = useDealerLanguage();
  return (
    <div className="bg-red-800 rounded-xl p-5 sm:p-6 text-white shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-red-200 text-sm sm:text-base">{title}</span>
        <div className="text-red-200">{icon}</div>
      </div>
      <div className="text-xl sm:text-2xl font-bold mb-2">{value}</div>
      <div className="flex items-center text-xs sm:text-sm">
        <span className={`mr-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '↗' : '↘'}
        </span>
        <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
          {change} {t("thisMonth")}
        </span>
      </div>
    </div>
  );
};

const SalesChart: React.FC = () => {
  const { t, language } = useDealerLanguage();
  const data = [
    { day: language === "es" ? 'Lun' : 'Mon', value: 28500, amount: '$28.5K', color: 'from-red-500 to-red-400' },
    { day: language === "es" ? 'Mar' : 'Tue', value: 32100, amount: '$32.1K', color: 'from-red-500 to-red-400' },
    { day: language === "es" ? 'Mié' : 'Wed', value: 24800, amount: '$24.8K', color: 'from-red-500 to-red-400' },
    { day: language === "es" ? 'Jue' : 'Thu', value: 18200, amount: '$18.2K', color: 'from-red-600 to-red-500' },
    { day: language === "es" ? 'Vie' : 'Fri', value: 45300, amount: '$45.3K', color: 'from-orange-500 to-red-400' },
    { day: language === "es" ? 'Sáb' : 'Sat', value: 38700, amount: '$38.7K', color: 'from-red-500 to-red-400' },
    { day: language === "es" ? 'Dom' : 'Sun', value: 22100, amount: '$22.1K', color: 'from-red-600 to-red-500' },
  ];

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));

  return (
    <div className="bg-red-800 rounded-xl p-5 sm:p-6 text-white shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div>
          <h3 className="text-lg sm:text-xl font-bold mb-1 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-red-300" />
            {t("salesReport")}
          </h3>
          <p className="text-red-200 text-sm">{t("weeklyPerformance")}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
          {['1D', '7D', '30D', '3M', '1Y'].map((period, index) => (
            <button
              key={period}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                index === 1 
                  ? 'bg-white text-red-800 shadow-sm' 
                  : 'bg-red-700/50 text-red-100 hover:bg-red-600/60 hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-red-900/20 rounded-xl p-4 sm:p-6 backdrop-blur-sm overflow-x-auto">
        <div className="relative min-w-[500px] sm:min-w-0">
          <div className="absolute inset-0 flex flex-col justify-between opacity-20">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={line} className="h-px bg-red-400"></div>
            ))}
          </div>

          <div className="flex items-end justify-between h-56 sm:h-64 mb-4">
            {data.map((item, index) => {
              const height = ((item.value - minValue) / (maxValue - minValue)) * 220 + 20;
              const isHighest = item.value === maxValue;

              return (
                <div key={index} className="flex flex-col items-center group relative flex-1 mx-1">
                  <div className="absolute -top-14 sm:-top-16 bg-gray-900 text-white text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg border border-gray-700">
                    <div className="font-semibold">{item.amount}</div>
                    <div className="text-gray-300 text-xs">{item.day}</div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>

                  <div className="relative flex flex-col items-center w-full">
                    <div
                      className={`w-5 sm:w-8 rounded-t-lg transition-all duration-500 ease-out group-hover:scale-105 shadow-lg ${
                        isHighest 
                          ? 'bg-gradient-to-t from-orange-600 via-orange-500 to-orange-400 shadow-orange-500/30' 
                          : `bg-gradient-to-t ${item.color} shadow-red-500/20`
                      }`}
                      style={{ height: `${height}px` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-lg"></div>
                    </div>
                    <div className="w-5 sm:w-8 h-1 bg-red-700 rounded-b-sm"></div>
                  </div>

                  <span className="text-red-200 text-xs sm:text-sm mt-2 sm:mt-3 font-medium group-hover:text-white transition-colors duration-200">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between text-red-300/60 text-xs px-2 sm:px-4 mb-2">
          <span>$0</span>
          <span>$15K</span>
          <span>$30K</span>
          <span>$45K</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-red-700/50 text-center">
        <div>
          <div className="text-lg sm:text-xl font-bold flex items-center justify-center">
            <DollarSign className="w-4 h-4 mr-1 text-green-400" />
            209.7K
          </div>
          <div className="text-red-200 text-sm">Total Sales</div>
        </div>
        <div>
          <div className="text-lg sm:text-xl font-bold text-green-400">+18.2%</div>
          <div className="text-red-200 text-sm">vs Last Week</div>
        </div>
        <div>
          <div className="text-lg sm:text-xl font-bold text-orange-400">Friday</div>
          <div className="text-red-200 text-sm">Peak Day</div>
        </div>
      </div>
    </div>
  );
};

const DonutChart: React.FC = () => (
  <div className="bg-red-800 rounded-xl p-5 sm:p-6 text-white shadow-lg">
    <div className="mb-4">
      <h3 className="text-lg sm:text-xl font-bold mb-1">Analytical Performance</h3>
      <p className="text-red-200 text-sm">Your Monthly Performance Data</p>
    </div>
    <div className="flex justify-center items-center">
      <div className="relative">
        <svg width="180" height="180" className="transform -rotate-90">
          <circle cx="90" cy="90" r="70" fill="none" stroke="#dc2626" strokeWidth="18" />
          <circle cx="90" cy="90" r="70" fill="none" stroke="#0891b2" strokeWidth="18" strokeDasharray="201.06 301.59" />
          <circle cx="90" cy="90" r="70" fill="none" stroke="#f59e0b" strokeWidth="18" strokeDasharray="120.64 381.01" strokeDashoffset="-201.06" />
          <circle cx="90" cy="90" r="70" fill="none" stroke="#ea580c" strokeWidth="18" strokeDasharray="80.42 421.23" strokeDashoffset="-321.7" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-400">1,154</div>
            <div className="text-xs sm:text-sm text-red-200">Orders</div>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-6 space-y-3 text-sm sm:text-base">
      {[
        { label: 'Total Paid', color: 'bg-cyan-600', text: 'text-cyan-400', value: '400', percent: '40%' },
        { label: 'Total Overdue', color: 'bg-yellow-500', text: 'text-yellow-500', value: '360', percent: '36%' },
        { label: 'Total Unpaid', color: 'bg-orange-600', text: 'text-orange-600', value: '240', percent: '24%' },
      ].map((item, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 ${item.color} rounded-full mr-3`}></div>
            <span>{item.label}</span>
          </div>
          <div className="flex items-center">
            <span className="text-white mr-2">{item.percent}</span>
            <span className={`${item.text} font-bold`}>{item.value}</span>
          </div>
        </div>
      ))}
    </div>
    <button className="w-full mt-5 border border-red-600 rounded-lg py-2 text-sm hover:bg-red-700 transition-colors">
      See More Complete Data
    </button>
  </div>
);

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
  ];

  return (
    <div className="bg-red-800 rounded-xl p-5 sm:p-6 text-white shadow-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <h3 className="text-lg sm:text-xl font-bold">Order History</h3>
        <div className="flex items-center space-x-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-300" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full sm:w-48 bg-red-700 text-white placeholder-red-300 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button className="bg-red-700 p-2 rounded-lg hover:bg-red-600 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="text-left border-b border-red-600 text-xs sm:text-sm">
              {['Product', 'Date', 'Order No', 'Customer name', 'Price', 'Status', ''].map((header, idx) => (
                <th key={idx} className="pb-3 text-red-200 font-medium whitespace-nowrap">
                  {header} {idx < 6 && <ChevronDown className="inline w-3 h-3 ml-1" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index} className="border-b border-red-700 text-xs sm:text-sm">
                <td className="py-3 sm:py-4">{order.product}</td>
                <td className="py-3 sm:py-4">
                  <div>{order.date}</div>
                  <div className="text-red-300 text-xs">{order.time}</div>
                </td>
                <td className="py-3 sm:py-4">{order.orderNo}</td>
                <td className="py-3 sm:py-4">
                  <div className="flex items-center">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${order.initial === 'M' ? 'bg-purple-500' : 'bg-blue-500'} flex items-center justify-center text-white text-xs sm:text-sm font-bold mr-3`}>
                      {order.initial}
                    </div>
                    <span>{order.customer}</span>
                  </div>
                </td>
                <td className="py-3 sm:py-4">{order.price}</td>
                <td className="py-3 sm:py-4">
                  <span className={`px-3 py-1 rounded-full text-xs sm:text-sm ${order.statusColor}`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-3 sm:py-4">
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

const Conversion: React.FC = () => (
  <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard title="Revenue" value="$5467.46" change="+31%" isPositive={true} icon={<div className="w-5 h-5 bg-red-700 rounded"></div>} />
        <MetricCard title="Visitor" value="12,235" change="-21%" isPositive={false} icon={<div className="w-5 h-5 bg-red-700 rounded-full"></div>} />
        <MetricCard title="Total Order" value="5,903" change="-21%" isPositive={false} icon={<div className="w-5 h-5 bg-red-700 rounded"></div>} />
        <MetricCard title="Total Customer" value="2521" change="+2.7%" isPositive={true} icon={<div className="w-5 h-5 bg-red-700 rounded"></div>} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <SalesChart />
        <DonutChart />
      </div>

      {/* Order History */}
      <OrderHistory />
    </div>
  </div>
);

export default Conversion;
