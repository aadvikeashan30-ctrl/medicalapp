import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function RevenueChart({ monthly = [] }) {
  const ref = useRef(null);

  // Build a 6-month axis even if some months are missing
  const labels = monthly.map((m) => m._id);
  const values = monthly.map((m) => m.revenue || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `₹${(ctx.parsed.y || 0).toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => `₹${(v / 1000).toFixed(0)}K` },
        grid: { color: '#f1f5f9' }
      },
      x: { grid: { display: false } }
    }
  };

  useEffect(() => () => ref.current?.destroy?.(), []);

  if (!labels.length) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-gray-400">
        No revenue yet. Start logging bills to see trends.
      </div>
    );
  }

  return (
    <div className="h-56">
      <Line ref={ref} data={data} options={options} />
    </div>
  );
}
