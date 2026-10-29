import { motion } from "framer-motion";

const forecastData = [
  { month: "Jul", actual: 65, forecast: null },
  { month: "Aug", actual: 72, forecast: null },
  { month: "Sep", actual: 68, forecast: null },
  { month: "Oct", actual: 85, forecast: null },
  { month: "Nov", actual: 92, forecast: null },
  { month: "Dec", actual: 112, forecast: null },
  { month: "Jan", actual: null, forecast: 118 },
  { month: "Feb", actual: null, forecast: 125 },
  { month: "Mar", actual: null, forecast: 135 },
];

const confidenceBands = [
  { month: "Jan", low: 105, high: 130 },
  { month: "Feb", low: 110, high: 140 },
  { month: "Mar", low: 115, high: 155 },
];

export default function RevenueForecastChart() {
  const maxValue = 155;
  const chartHeight = 100;
  const chartWidth = 400;
  const padding = 35;

  const getY = (value: number) => chartHeight - (value / maxValue) * chartHeight + 15;
  const getX = (index: number) => padding + (index * (chartWidth - padding * 2)) / (forecastData.length - 1);

  // Generate path for actual data
  const actualPath = forecastData
    .filter(d => d.actual !== null)
    .map((d, i) => {
      const x = getX(forecastData.indexOf(d));
      const y = getY(d.actual!);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate path for forecast data
  const forecastPath = forecastData
    .filter(d => d.forecast !== null || (d.actual !== null && forecastData.indexOf(d) === 5))
    .map((d, i) => {
      const x = getX(forecastData.indexOf(d));
      const y = getY(d.forecast ?? d.actual!);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-4 p-5 sm:p-6 rounded-xl bg-gradient-to-br from-white via-slate-50 to-cyan-50 border border-slate-200 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-base sm:text-lg font-bold text-slate-800">Revenue Forecast</h4>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 font-semibold border border-cyan-200">AI Predicted</span>
        </motion.div>
      </div>

      {/* Chart - Full width */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`} className="w-full h-auto" style={{ minHeight: '160px' }} preserveAspectRatio="xMidYMid meet">
          {/* Confidence bands */}
          <motion.path
            d={`
              M ${getX(6)} ${getY(confidenceBands[0].high)}
              L ${getX(7)} ${getY(confidenceBands[1].high)}
              L ${getX(8)} ${getY(confidenceBands[2].high)}
              L ${getX(8)} ${getY(confidenceBands[2].low)}
              L ${getX(7)} ${getY(confidenceBands[1].low)}
              L ${getX(6)} ${getY(confidenceBands[0].low)}
              Z
            `}
            fill="hsl(199, 89%, 48%)"
            fillOpacity={0.15}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          />

          {/* Grid lines */}
          {[0, 50, 100, 150].map((val) => (
            <motion.line
              key={val}
              x1={padding}
              y1={getY(val)}
              x2={chartWidth - padding}
              y2={getY(val)}
              stroke="hsl(220, 10%, 90%)"
              strokeWidth="1"
              strokeDasharray="4,4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
          ))}

          {/* Actual line */}
          <motion.path
            d={actualPath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
          />

          {/* Forecast line (dashed) */}
          <motion.path
            d={`M ${getX(5)} ${getY(112)} ${forecastPath.replace('M', 'L')}`}
            fill="none"
            stroke="hsl(199, 89%, 48%)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6,4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
          />

          {/* Data points */}
          {forecastData.map((d, i) => {
            const value = d.actual ?? d.forecast;
            if (value === null) return null;
            const x = getX(i);
            const y = getY(value);
            const isForecast = d.forecast !== null;

            return (
              <motion.circle
                key={d.month}
                cx={x}
                cy={y}
                r={5}
                fill={isForecast ? "hsl(199, 89%, 48%)" : "hsl(var(--primary))"}
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.08, type: "spring" }}
                className="drop-shadow-sm"
              />
            );
          })}

          {/* X-axis labels */}
          {forecastData.map((d, i) => (
            <motion.text
              key={d.month}
              x={getX(i)}
              y={chartHeight + 30}
              textAnchor="middle"
              className={`text-[9px] sm:text-[10px] font-semibold ${d.forecast !== null ? 'fill-cyan-600' : 'fill-slate-500'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              {d.month}
            </motion.text>
          ))}
        </svg>
      </div>

      {/* Legend & Prediction */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between"
      >
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-primary rounded-full" />
            <span className="text-xs sm:text-sm text-slate-600 font-medium">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-cyan-500 rounded-full" style={{ borderStyle: 'dashed' }} />
            <span className="text-xs sm:text-sm text-slate-600 font-medium">Forecast</span>
          </div>
        </div>
        <div className="text-right p-3 rounded-xl bg-cyan-100 border border-cyan-200">
          <p className="text-lg sm:text-xl font-bold text-cyan-600">$135K</p>
          <p className="text-xs text-slate-600 font-medium">Q1 Target (89%)</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
