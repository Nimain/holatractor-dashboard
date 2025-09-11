"use client";
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Smartphone, Tablet, Monitor, Target, TrendingUp, MousePointer, Zap } from 'lucide-react';

const MetricsCards = () => {
  const metrics = [
    {
      title: 'Popups',
      value: '50',
      icon: Zap,
      visual: 'blocks'
    },
    {
      title: 'Impressions',
      value: '49677',
      icon: Target,
      trend: [20, 35, 25, 40, 30, 45, 35, 50, 40]
    },
    {
      title: 'Conversions',
      value: '514',
      icon: MousePointer,
      trend: [15, 25, 35, 30, 45, 35, 40, 30, 35]
    },
    {
      title: 'Conversion Rate',
      value: '32%',
      icon: TrendingUp,
      trend: [25, 30, 35, 40, 35, 45, 40, 50, 45]
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div key={metric.title} className="bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500 rounded-lg">
                <IconComponent className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
              <p className="text-sm opacity-90">{metric.title}</p>
            </div>

            {metric.visual === 'blocks' && (
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-400 rounded"></div>
                <div className="w-8 h-8 bg-orange-500 rounded"></div>
              </div>
            )}

            {metric.trend && (
              <div className="h-12 bg-gray-200 rounded-lg p-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metric.trend.map((value, i) => ({ value }))}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const StatisticsCard = () => {
  const chartData = [
    { month: 'Jan', impression: 50, conversion: 12 },
    { month: 'Feb', impression: 80, conversion: 8 },
    { month: 'Mar', impression: 60, conversion: 35 },
    { month: 'Apr', impression: 32, conversion: 15 },
    { month: 'May', impression: 75, conversion: 28 },
    { month: 'Jun', impression: 95, conversion: 35 },
    { month: 'Jul', impression: 65, conversion: 52 },
    { month: 'Aug', impression: 90, conversion: 45 }
  ];

  return (
    <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-6 text-white shadow-xl h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Statistics</h2>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span>Impression</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Conversion</span>
          </div>
        </div>
      </div>
      
      <div className="h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'white', fontSize: 14 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'white', fontSize: 14 }}
              domain={[0, 100]}
            />
            <Bar 
              dataKey="impression" 
              fill="white" 
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Overlay the smooth wave line connecting impression bar tops */}
        <div className="absolute inset-0 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 10, left: 90, bottom: 5 }}>
              <Line
                type="basis"
                dataKey="impression"
                stroke="#f97316"
                strokeWidth={4}
                dot={false}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const DevicesCard = () => {
  const deviceData = [
    { name: 'Mobile', value: 75, color: '#f97316', icon: Smartphone },
    { name: 'Tablet', value: 35, color: '#ef4444', icon: Tablet },
    { name: 'PC\'s', value: 60, color: '#22c55e', icon: Monitor }
  ];

  return (
    <div className="bg-gradient-to-br from-red-700 to-red-900 rounded-2xl  text-white shadow-xl h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-8">Devices</h2>
      <div className="flex justify-between items-end flex-1 px-4">
        {deviceData.map((device, index) => {
          const IconComponent = device.icon;
          return (
            <div key={device.name} className="flex flex-col items-center group cursor-pointer h-full justify-end">
              <div className="relative mb-6 flex-1 flex items-end">
                <div 
                  className="w-16 bg-gray-300 rounded-t-lg transition-all duration-300 group-hover:scale-105"
                  style={{ height: '200px' }}
                >
                  <div 
                    className="w-full rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ 
                      height: `${(device.value / 100) * 100}%`,
                      backgroundColor: device.color,
                      marginTop: `${100 - device.value}%`,
                      animation: `fillUp${index} 1.5s ease-out ${index * 0.3}s both`
                    }}
                  />
                </div>
              </div>
              <div className="text-center">
                <span className="text-base font-semibold block">{device.name}</span>
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes fillUp0 {
          from { height: 0%; margin-top: 100%; }
          to { height: 75%; margin-top: 25%; }
        }
        @keyframes fillUp1 {
          from { height: 0%; margin-top: 100%; }
          to { height: 35%; margin-top: 65%; }
        }
        @keyframes fillUp2 {
          from { height: 0%; margin-top: 100%; }
          to { height: 60%; margin-top: 40%; }
        }
      `}</style>
    </div>
  );
};

export default function AnalyticsDashboard() {
  return (
    <div className="p-3 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-red-600 mb-8">Analytics</h1>
        
        {/* Top row - 4 metric cards */}
        <MetricsCards />
        
        {/* Bottom row - Statistics (large) and Devices (smaller) */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <StatisticsCard />
          </div>
          <div className="col-span-1">
            <DevicesCard />
          </div>
        </div>
      </div>
    </div>
  );
}