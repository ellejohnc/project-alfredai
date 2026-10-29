import { motion } from "framer-motion";
import { useState } from "react";

const departments = [
  { name: "Sales", performance: 85, budget: 92, satisfaction: 78, efficiency: 88 },
  { name: "Marketing", performance: 72, budget: 85, satisfaction: 82, efficiency: 75 },
  { name: "Engineering", performance: 95, budget: 78, satisfaction: 88, efficiency: 92 },
  { name: "Operations", performance: 88, budget: 95, satisfaction: 75, efficiency: 85 },
  { name: "HR", performance: 78, budget: 88, satisfaction: 92, efficiency: 80 },
];

const metrics = ["Performance", "Budget", "Satisfaction", "Efficiency"];
const colors = ["hsl(var(--primary))", "hsl(262, 83%, 58%)", "hsl(142, 76%, 36%)"];

interface TooltipData {
  x: number;
  y: number;
  dept: string;
  metric: string;
  value: number;
  color: string;
}

export default function DepartmentRadarChart() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const centerX = 120;
  const centerY = 90;
  const maxRadius = 60;

  const getPolygonPoints = (values: number[]) => {
    return values.map((value, index) => {
      const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
      const radius = (value / 100) * maxRadius;
      return `${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`;
    }).join(" ");
  };

  const getPointPosition = (value: number, metricIndex: number) => {
    const angle = (Math.PI * 2 * metricIndex) / metrics.length - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-white via-slate-50 to-purple-50 border border-slate-200 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-base sm:text-lg font-bold text-slate-800">Department Performance</h4>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
        {/* Radar Chart */}
        <div className="sm:col-span-2 w-full">
          <div className="bg-white rounded-xl p-4 border border-slate-200 relative">
            <svg viewBox="0 0 240 180" className="w-full h-auto" style={{ minHeight: '160px' }}>
              {/* Background circles */}
              {[25, 50, 75, 100].map((level) => (
                <motion.circle
                  key={level}
                  cx={centerX}
                  cy={centerY}
                  r={(level / 100) * maxRadius}
                  fill="none"
                  stroke="hsl(220, 10%, 85%)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: level * 0.005 }}
                />
              ))}
              
              {/* Axis lines */}
              {metrics.map((_, index) => {
                const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
                return (
                  <motion.line
                    key={index}
                    x1={centerX}
                    y1={centerY}
                    x2={centerX + maxRadius * Math.cos(angle)}
                    y2={centerY + maxRadius * Math.sin(angle)}
                    stroke="hsl(220, 10%, 85%)"
                    strokeWidth="1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                );
              })}

              {/* Department polygons */}
              {departments.slice(0, 3).map((dept, deptIndex) => {
                const values = [dept.performance, dept.budget, dept.satisfaction, dept.efficiency];
                return (
                  <motion.polygon
                    key={dept.name}
                    points={getPolygonPoints(values)}
                    fill={colors[deptIndex]}
                    fillOpacity={0.2}
                    stroke={colors[deptIndex]}
                    strokeWidth="2.5"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + deptIndex * 0.15, duration: 0.5 }}
                    style={{ transformOrigin: `${centerX}px ${centerY}px` }}
                  />
                );
              })}

              {/* Interactive data points */}
              {departments.slice(0, 3).map((dept, deptIndex) => {
                const values = [dept.performance, dept.budget, dept.satisfaction, dept.efficiency];
                return values.map((value, metricIndex) => {
                  const pos = getPointPosition(value, metricIndex);
                  const isHovered = tooltip?.dept === dept.name && tooltip?.metric === metrics[metricIndex];
                  return (
                    <motion.circle
                      key={`${dept.name}-${metrics[metricIndex]}`}
                      cx={pos.x}
                      cy={pos.y}
                      r={isHovered ? 6 : 4}
                      fill={colors[deptIndex]}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + deptIndex * 0.1 + metricIndex * 0.05 }}
                      onMouseEnter={() => setTooltip({
                        x: pos.x,
                        y: pos.y,
                        dept: dept.name,
                        metric: metrics[metricIndex],
                        value,
                        color: colors[deptIndex]
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                });
              })}

              {/* Tooltip */}
              {tooltip && (
                <g>
                  <rect
                    x={tooltip.x + 8}
                    y={tooltip.y - 28}
                    width="75"
                    height="32"
                    rx="4"
                    fill="hsl(220, 20%, 20%)"
                    fillOpacity="0.95"
                  />
                  <polygon
                    points={`${tooltip.x + 8},${tooltip.y - 12} ${tooltip.x + 3},${tooltip.y - 6} ${tooltip.x + 8},${tooltip.y}`}
                    fill="hsl(220, 20%, 20%)"
                    fillOpacity="0.95"
                  />
                  <text
                    x={tooltip.x + 45}
                    y={tooltip.y - 17}
                    textAnchor="middle"
                    className="text-[8px] fill-white font-semibold"
                  >
                    {tooltip.dept}
                  </text>
                  <text
                    x={tooltip.x + 45}
                    y={tooltip.y - 6}
                    textAnchor="middle"
                    className="text-[9px] fill-white font-bold"
                  >
                    {tooltip.metric}: {tooltip.value}%
                  </text>
                </g>
              )}

              {/* Metric labels */}
              {metrics.map((metric, index) => {
                const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
                const labelRadius = maxRadius + 18;
                return (
                  <motion.text
                    key={metric}
                    x={centerX + labelRadius * Math.cos(angle)}
                    y={centerY + labelRadius * Math.sin(angle)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9px] sm:text-[10px] fill-slate-600 font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {metric}
                  </motion.text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col justify-center gap-3 w-full">
          {departments.slice(0, 3).map((dept, index) => (
            <motion.div
              key={dept.name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 border border-slate-200"
            >
              <div 
                className="w-4 h-4 rounded-md shadow-sm flex-shrink-0"
                style={{ backgroundColor: colors[index] }}
              />
              <span className="text-sm text-slate-600 font-medium">{dept.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-2 gap-4"
      >
        <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-lg sm:text-xl font-bold text-primary">Engineering</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Top Performer</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-emerald-100 border border-emerald-200">
          <p className="text-lg sm:text-xl font-bold text-emerald-600">84%</p>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Avg Score</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
