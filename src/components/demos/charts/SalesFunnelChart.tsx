import { motion } from "framer-motion";

const funnelData = [
  { stage: "Leads", value: 2847, percentage: 100, color: "hsl(var(--primary))", bgColor: "bg-primary/10" },
  { stage: "Qualified", value: 1423, percentage: 50, color: "hsl(262, 83%, 58%)", bgColor: "bg-purple-100" },
  { stage: "Proposal", value: 568, percentage: 20, color: "hsl(199, 89%, 48%)", bgColor: "bg-cyan-100" },
  { stage: "Negotiation", value: 284, percentage: 10, color: "hsl(142, 76%, 36%)", bgColor: "bg-emerald-100" },
  { stage: "Closed Won", value: 142, percentage: 5, color: "hsl(47, 100%, 50%)", bgColor: "bg-amber-100" },
];

export default function SalesFunnelChart() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-white via-slate-50 to-purple-50 border border-slate-200 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-base sm:text-lg font-bold text-slate-800">Sales Pipeline</h4>
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

      {/* Funnel visualization - Full width */}
      <div className="space-y-3">
        {funnelData.map((item, index) => (
          <motion.div
            key={item.stage}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="relative"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 w-24 sm:w-28 text-right font-medium">
                {item.stage}
              </span>
              <div className="flex-1 h-10 sm:h-12 bg-slate-100 rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-lg flex items-center justify-end pr-4 relative"
                  style={{ 
                    backgroundColor: item.color,
                    marginLeft: `${(100 - item.percentage) / 2}%`
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="text-sm sm:text-base font-bold text-white drop-shadow-sm"
                  >
                    {item.value.toLocaleString()}
                  </motion.span>
                </motion.div>
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-sm sm:text-base font-bold w-14 text-right"
                style={{ color: item.color }}
              >
                {item.percentage}%
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Conversion rates */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-3 gap-4"
      >
        <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-lg sm:text-xl font-bold text-primary">5%</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Win Rate</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-emerald-100 border border-emerald-200">
          <p className="text-lg sm:text-xl font-bold text-emerald-600">$2.4M</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Pipeline Value</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-100 border border-amber-200">
          <p className="text-lg sm:text-xl font-bold text-amber-600">32 days</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Avg. Cycle</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
