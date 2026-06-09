import React, { memo } from 'react';
import { Chart } from 'react-google-charts';

const GoogleAreaChart = memo(({ data, colors }) => {
  const options = {
    legend: 'none',
    hAxis: {
      textStyle: { color: '#94a3b8', fontSize: 11, fontName: 'Manrope' },
      gridlines: { color: 'transparent' },
      baselineColor: 'transparent',
    },
    vAxis: {
      textStyle: { color: '#94a3b8', fontSize: 11, fontName: 'Manrope' },
      gridlines: { color: '#f8fafc' }, // Subtle gridlines matching slate-50
      baselineColor: 'transparent',
    },
    colors: colors || ['#6366f1'], // Default vibrant indigo
    chartArea: { width: '85%', height: '75%' },
    backgroundColor: 'transparent',
    animation: {
      startup: true,
      easing: 'out',
      duration: 1000,
    },
    areaOpacity: 0.15,
    lineWidth: 3,
    pointSize: 0, // Hides points for a smoother look until hovered
  };

  return (
    <div className="w-full h-full font-manrope">
      <Chart chartType="AreaChart" width="100%" height="100%" data={data} options={options} />
    </div>
  );
});

GoogleAreaChart.displayName = 'GoogleAreaChart';
export default GoogleAreaChart;