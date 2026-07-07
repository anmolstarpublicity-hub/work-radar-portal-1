import React, { useEffect, useRef, memo } from 'react';

const GooglePieChart = memo(({ data, title, colors, is3D = true, pieHole, hideLegend = false }) => {
  const chartRef = useRef(null);
  const isDarkMode = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const drawChart = () => {
      if (!window.google || !window.google.visualization) {
        console.error('Google Charts library not loaded.');
        return;
      }
      const chartData = window.google.visualization.arrayToDataTable([
        ['Task Status', 'Count'],
        ...data.map(item => [item.name, item.value])
      ]);

      const options = {
        title: title,
        is3D: is3D,
        pieHole: pieHole,
        backgroundColor: 'transparent',
        legend: hideLegend ? 'none' : {
          position: 'right',
          alignment: 'center',
          textStyle: { color: isDarkMode ? '#FFFFFF' : '#334155' }
        },
        chartArea: hideLegend ? { left: '5%', top: '5%', width: '90%', height: '90%' } : { left: 10, top: 20, width: '90%', height: '90%' },
        titleTextStyle: { color: isDarkMode ? '#FFFFFF' : '#334155' },
        colors: colors ? data.map(item => colors[item.name]) : undefined,
      };

      if (chartRef.current) {
        const chart = new window.google.visualization.PieChart(chartRef.current);
        chart.draw(chartData, options);
      }
    };

    // Assuming the script is loaded in index.html
    window.google?.charts?.load?.('current', { packages: ['corechart'] });
    if (window.google?.charts?.setOnLoadCallback) window.google.charts.setOnLoadCallback(drawChart);
  }, [data, title, colors, is3D, pieHole, isDarkMode]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }}></div>;
});

GooglePieChart.displayName = 'GooglePieChart';
export default GooglePieChart;