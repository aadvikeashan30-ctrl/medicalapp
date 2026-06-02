import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { useApi } from '../hooks/useApi';
import AnimatedCounter from './AnimatedCounter';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function ProfitLossWidget() {
  const { data: revenue } = useApi('/billing/revenue/summary');
  const { data: expenses } = useApi('/expenses/summary');

  const monthRevenue = revenue?.month || 0;
  const monthExpenses = expenses?.thisMonth || 0;
  const profit = monthRevenue - monthExpenses;
  const isProfit = profit >= 0;
  const margin = monthRevenue > 0 ? Math.round((profit / monthRevenue) * 100) : 0;

  return (
    <div className="card bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FiDollarSign className="text-emerald-600" /> Monthly P&L
      </h3>

      <div className="space-y-3">
        {/* Revenue */}
        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
          <div className="flex items-center gap-2">
            <FiTrendingUp className="text-emerald-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Revenue</span>
          </div>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatINR(monthRevenue)}</span>
        </div>

        {/* Expenses */}
        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <div className="flex items-center gap-2">
            <FiTrendingDown className="text-red-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expenses</span>
          </div>
          <span className="font-bold text-red-700 dark:text-red-400">-{formatINR(monthExpenses)}</span>
        </div>

        {/* Net */}
        <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
          isProfit
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
        }`}>
          <div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Net {isProfit ? 'Profit' : 'Loss'}</span>
            {margin !== 0 && (
              <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                isProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {isProfit ? '+' : ''}{margin}%
              </span>
            )}
          </div>
          <span className={`text-xl font-bold ${isProfit ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            {isProfit ? '+' : ''}{formatINR(profit)}
          </span>
        </div>
      </div>
    </div>
  );
}
