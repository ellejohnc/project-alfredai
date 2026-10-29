import { motion } from "framer-motion";

const workforceData = [
  { department: "Engineering", count: 45, percentage: 35, color: "hsl(var(--primary))" },
  { department: "Sales", count: 28, percentage: 22, color: "hsl(262, 83%, 58%)" },
  { department: "Operations", count: 22, percentage: 17, color: "hsl(142, 76%, 36%)" },
  { department: "Marketing", count: 18, percentage: 14, color: "hsl(199, 89%, 48%)" },
  { department: "HR & Admin", count: 15, percentage: 12, color: "hsl(47, 100%, 50%)" },
];

export default function WorkforceDonutChart() {
  const totalEmployees = workforceData.reduce((sum, d) => sum + d.count, 0);
  const centerX = 50;
  const centerY = 50;
  const radius = 40;
  const innerRadius = 26;

  // Calculate arc paths
  let cumulativePercentage = 0;
  const arcs = workforceData.map((item) => {
    const startAngle = (cumulativePercentage / 100) * Math.PI * 2 - Math.PI / 2;
    cumulativePercentage += item.percentage;
    const endAngle = (cumulativePercentage / 100) * Math.PI * 2 - Math.PI / 2;

    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const innerStartX = centerX + innerRadius * Math.cos(startAngle);
    const innerStartY = centerY + innerRadius * Math.sin(startAngle);
    const innerEndX = centerX + innerRadius * Math.cos(endAngle);
    const innerEndY = centerY + innerRadius * Math.sin(endAngle);

    const largeArcFlag = item.percentage > 50 ? 1 : 0;

    return {
      ...item,
      path: `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} L ${innerEndX} ${innerEndY} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY} Z`,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-white via-slate-50 to-amber-50 border border-slate-200 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-base sm:text-lg font-bold text-slate-800">Workforce Distribution</h4>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        {/* Donut Chart */}
        <div className="w-full">
          <div className="bg-white rounded-xl p-4 border border-slate-200 flex justify-center">
            <svg viewBox="0 0 100 100" className="w-full max-w-[180px] h-auto aspect-square">
              {arcs.map((arc, index) => (
                <motion.path
                  key={arc.department}
                  d={arc.path}
                  fill={arc.color}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.2 + index * 0.1, 
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                  style={{ transformOrigin: `${centerX}px ${centerY}px` }}
                  className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-sm"
                />
              ))}
              
              {/* Center text */}
              <motion.text
                x={centerX}
                y={centerY - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[18px] sm:text-[20px] font-bold fill-slate-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {totalEmployees}
              </motion.text>
              <motion.text
                x={centerX}
                y={centerY + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[7px] sm:text-[8px] fill-slate-500 font-semibold tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                EMPLOYEES
              </motion.text>
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 gap-2 sm:gap-3 w-full">
          {workforceData.map((item, index) => (
            <motion.div
              key={item.department}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.08 }}
              className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-200"
            >
              <div 
                className="w-4 h-4 rounded-md shadow-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-600 font-medium flex-1">{item.department}</span>
              <span className="text-sm font-bold text-slate-800">{item.count}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-3 gap-4"
      >
        <div className="text-center p-3 rounded-xl bg-emerald-100 border border-emerald-200">
          <p className="text-lg sm:text-xl font-bold text-emerald-600">+12%</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">YoY Growth</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-lg sm:text-xl font-bold text-primary">4.2%</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Turnover</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-100 border border-amber-200">
          <p className="text-lg sm:text-xl font-bold text-amber-600">8.5</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Avg Tenure</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
