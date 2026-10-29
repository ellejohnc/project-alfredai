import { motion } from "framer-motion";

const cashFlowData = [
  { label: "Opening", value: 850, type: "neutral", cumulative: 850 },
  { label: "Revenue", value: 420, type: "positive", cumulative: 1270 },
  { label: "Services", value: 180, type: "positive", cumulative: 1450 },
  { label: "Payroll", value: -280, type: "negative", cumulative: 1170 },
  { label: "Ops", value: -120, type: "negative", cumulative: 1050 },
  { label: "Marketing", value: -65, type: "negative", cumulative: 985 },
  { label: "Closing", value: 985, type: "neutral", cumulative: 985 },
];

export default function CashFlowWaterfallChart() {
  const maxValue = Math.max(...cashFlowData.map(d => d.cumulative));
  const chartHeight = 120;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-white via-slate-50 to-emerald-50 border border-slate-200 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-base sm:text-lg font-bold text-slate-800">Cash Flow Analysis</h4>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">Q4 2024</span>
        </motion.div>
      </div>

      {/* Waterfall Chart - Full width */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="relative" style={{ height: chartHeight + 40 }}>
          <div className="flex items-end justify-between h-full gap-2 sm:gap-3 pb-8">
            {cashFlowData.map((item, index) => {
              const barHeight = (Math.abs(item.value) / maxValue) * chartHeight;
              const baseHeight = item.type === "neutral" 
                ? 0 
                : ((cashFlowData[index - 1]?.cumulative || 0) / maxValue) * chartHeight;
              
              const isPositive = item.type === "positive";
              const isNegative = item.type === "negative";
              const isNeutral = item.type === "neutral";

              const color = isPositive 
                ? "hsl(142, 76%, 36%)" 
                : isNegative 
                  ? "hsl(0, 84%, 60%)" 
                  : "hsl(var(--primary))";

              const bgClass = isPositive 
                ? "bg-gradient-to-t from-emerald-500 to-emerald-400" 
                : isNegative 
                  ? "bg-gradient-to-t from-red-500 to-red-400" 
                  : "bg-gradient-to-t from-primary to-primary/80";

              return (
                <div 
                  key={item.label} 
                  className="flex-1 flex flex-col items-center relative"
                  style={{ height: chartHeight }}
                >
                  {/* Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barHeight }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5, ease: "easeOut" }}
                    className={`absolute w-full rounded-t-lg shadow-sm min-w-[20px] ${bgClass}`}
                    style={{ 
                      bottom: isNeutral ? 0 : `${baseHeight}px`,
                    }}
                  >
                    {/* Value label */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100"
                    >
                      <span 
                        className="text-xs sm:text-sm font-bold"
                        style={{ color }}
                      >
                        {item.value > 0 && !isNeutral ? "+" : ""}{item.value}K
                      </span>
                    </motion.div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between">
            {cashFlowData.map((item, index) => (
              <motion.span
                key={item.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="text-[10px] sm:text-xs text-slate-500 flex-1 text-center font-medium"
              >
                {item.label}
              </motion.span>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-3 gap-3 sm:gap-4"
      >
        <div className="text-center p-3 sm:p-4 rounded-xl bg-emerald-100 border border-emerald-200">
          <p className="text-lg sm:text-xl font-bold text-emerald-600">+$600K</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Total Inflow</p>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-xl bg-red-100 border border-red-200">
          <p className="text-lg sm:text-xl font-bold text-red-600">-$465K</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Total Outflow</p>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-lg sm:text-xl font-bold text-primary">+$135K</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Net Change</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
