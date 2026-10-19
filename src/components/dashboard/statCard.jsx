
import React from 'react';

function StatCard({ item }) {
  const { label, value, detail, change, tone, icon: Icon } = item;

  const iconColors = {
    blue: 'bg-blue-500/30 text-blue-100',
    green: 'bg-green-500/20 text-green-300',
    red: 'bg-red-500/20 text-red-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
  };

  const changeColors = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
  };

 
return (
  <div className="relative flex h-[172px] min-w-0 w-full flex-col rounded-[20px] border border-slate-800 bg-[#0d151f] p-4 shadow-sm">
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] ${
        iconColors[tone] || iconColors.blue
      }`}
    >
      {Icon && <Icon size={21} strokeWidth={2} />}
    </div>

    <div
      className={`absolute right-4 top-4 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
        changeColors[tone] || changeColors.blue
      }`}
    >
      {change}
    </div>

    <div className="mt-2 text-[29px] font-bold leading-8 tracking-tight text-slate-200">
      {value}
    </div>

    <div className="mt-0.5 truncate text-[13px] font-medium leading-5 text-slate-300">
      {label}
    </div>

    <div className="mt-auto truncate pt-2 text-[11px] text-slate-500">
      {detail}
    </div>
  </div>
);
}

export default StatCard;
