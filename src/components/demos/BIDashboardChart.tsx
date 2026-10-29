import { motion } from "framer-motion";

type ChartData = {
  label: string;
  value: number;
  target?: number;
  color: string;
  bgColor: string;
};

const chartData: ChartData[] = [
  { label: "Revenue", value: 112, target: 100, color: "hsl(var(--primary))", bgColor: "bg-primary/10" },
  { label: "Sales", value: 89, target: 100, color: "hsl(262, 83%, 58%)", bgColor: "bg-purple-100" },
  { label: "Uptime", value: 99, target: 100, color: "hsl(142, 76%, 36%)", bgColor: "bg-emerald-100" },
  { label: "Retention", value: 96, target: 100, color: "hsl(199, 89%, 48%)", bgColor: "bg-cyan-100" },
];

const revenueData = [
  { month: "Jul", value: 65 },
  { month: "Aug", value: 72 },
  { month: "Sep", value: 68 },
  { month: "Oct", value: 85 },
  { month: "Nov", value: 92 },
  { month: "Dec", value: 112 },
];

export default function BIDashboardChart() {
  const maxRevenue = Math.max(...revenueData.map(d => d.value));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-white via-slate-50 to-primary/5 border border-slate-200 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-base sm:text-lg font-bold text-slate-800">Q4 Performance Dashboard</h4>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-700 font-semibold">Live</span>
        </motion.div>
      </div>

      {/* KPI Cards - Full width grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {chartData.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className={`p-4 rounded-xl ${item.bgColor} border border-slate-200/50`}
          >
            <p className="text-xs sm:text-sm text-slate-600 mb-1 font-medium">{item.label}</p>
            <div className="flex items-end gap-1.5">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: item.color }}
              >
                {item.value}%
              </motion.span>
              {item.target && item.value >= item.target && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
                  className="text-xs text-emerald-600 font-bold mb-1"
                >
                  ↑
                </motion.span>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-white/80 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(item.value, 100)}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart - Full width */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm sm:text-base font-semibold text-slate-800">Revenue Trend</p>
            <p className="text-xs text-slate-500 mt-0.5">H2 2024 Performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-primary to-primary/70" />
              <span className="text-xs text-slate-500">Monthly</span>
            </div>
            <div className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-600">+72% YoY</span>
            </div>
          </div>
        </div>
        
        {/* Chart area with grid lines */}
        <div className="relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-t border-dashed border-slate-200/80" />
            ))}
          </div>
          
          {/* Bars */}
          <div className="relative flex items-end gap-2 sm:gap-4 h-36 sm:h-44 pt-2">
            {revenueData.map((item, index) => {
              const heightPercent = (item.value / maxRevenue) * 100;
              const isHighest = item.value === maxRevenue;
              
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ 
                        delay: 0.5 + index * 0.1, 
                        duration: 0.6, 
                        ease: "easeOut" 
                      }}
                      className={`w-full max-w-[48px] rounded-t-lg relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                        isHighest 
                          ? 'bg-gradient-to-t from-primary via-primary to-primary/80 shadow-lg shadow-primary/20' 
                          : 'bg-gradient-to-t from-primary/80 to-primary/50 hover:from-primary hover:to-primary/70'
                      }`}
                      style={{ minHeight: '20px' }}
                    >
                      {/* Value tooltip */}
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md shadow-md border whitespace-nowrap ${
                          isHighest 
                            ? 'bg-primary text-white border-primary/20' 
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-bold">${item.value}K</span>
                      </motion.div>
                      
                      {/* Highlight indicator for highest */}
                      {isHighest && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.2, type: "spring" }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm"
                        >
                          <span className="text-[8px] font-bold text-amber-900">★</span>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                  
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className={`text-xs sm:text-sm font-medium ${isHighest ? 'text-primary font-semibold' : 'text-slate-500'}`}
                  >
                    {item.month}
                  </motion.span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Summary row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-5 pt-4 border-t border-slate-200 grid grid-cols-3 gap-3"
        >
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-primary">$494K</p>
            <p className="text-xs text-slate-500">Total Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-emerald-600">$82K</p>
            <p className="text-xs text-slate-500">Avg Monthly</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold text-amber-600">$112K</p>
            <p className="text-xs text-slate-500">Best Month</p>
          </div>
        </motion.div>
      </div>

      {/* Status indicator */}
      <div className="flex justify-center gap-1.5 mt-4 pt-4 border-t border-slate-200">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ 
              delay: 1 + i * 0.15, 
              duration: 1.5, 
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="w-2 h-2 rounded-full bg-primary/40"
          />
        ))}
      </div>
    </motion.div>
  );
}
