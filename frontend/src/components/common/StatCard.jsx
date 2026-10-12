import React from 'react';

function StatCard({ title, value, icon: Icon, color = 'blue', trend, trendLabel, loading = false }) {
  const colors = {
    blue:   { bg: 'bg-blue-50   dark:bg-blue-950',   icon: 'bg-blue-100   dark:bg-blue-900   text-blue-600   dark:text-blue-400',   text: 'text-blue-600'   },
    green:  { bg: 'bg-green-50  dark:bg-green-950',  icon: 'bg-green-100  dark:bg-green-900  text-green-600  dark:text-green-400',  text: 'text-green-600'  },
    red:    { bg: 'bg-red-50    dark:bg-red-950',    icon: 'bg-red-100    dark:bg-red-900    text-red-600    dark:text-red-400',    text: 'text-red-600'    },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950', icon: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950', icon: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400', text: 'text-purple-600' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`card p-5 ${c.bg} border-0`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          )}
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
