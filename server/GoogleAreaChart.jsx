import React, { useEffect, useRef } from 'react';

const GoogleAreaChart = ({ data, colors }) => {
  const chartRef = useRef(null);
  const isDarkMode = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const drawChart = () => {
      if (!window.google || !window.google.visualization) {
        return;
      }
      const chartData = google.visualization.arrayToDataTable(data);

      const options = {
        backgroundColor: 'transparent',
        legend: { position: 'none' },
        chartArea: { left: 30, top: 20, width: '95%', height: '75%' },
        hAxis: { textStyle: { color: isDarkMode ? '#94a3b8' : '#64748b' }, gridlines: { color: 'transparent' }, baselineColor: 'transparent' },
        vAxis: { textStyle: { color: isDarkMode ? '#94a3b8' : '#64748b' }, gridlines: { color: isDarkMode ? '#334155' : '#f1f5f9' }, baselineColor: 'transparent' },
        colors: colors,
        areaOpacity: 0.15,
        lineWidth: 3,
        pointSize: 4,
        animation: { startup: true, duration: 1000, easing: 'out' }
      };

      if (chartRef.current) {
        const chart = new google.visualization.AreaChart(chartRef.current);
        chart.draw(chartData, options);
      }
    };

    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(drawChart);
  }, [data, colors, isDarkMode]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }}></div>;
};

export default GoogleAreaChart;