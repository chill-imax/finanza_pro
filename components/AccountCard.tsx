import React from 'react';
import { Account, Currency } from '../types';
import { Pencil } from 'lucide-react';

interface Props {
  account: Account;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

export const AccountCard: React.FC<Props> = ({ account, onClick, onEdit }) => {
  // Use custom color if available, else fallback
  const bgColorStyle = account.color ? { backgroundColor: account.color } : {};
  const defaultBgClass = account.currency === Currency.USD ? 'bg-emerald-500' : 'bg-blue-500';
  
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-2xl shadow-lg text-white cursor-pointer hover:scale-[1.02] transition-transform duration-200 min-w-[160px] relative group ${!account.color ? defaultBgClass : ''}`}
      style={bgColorStyle}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm">
          {account.icon || (account.currency === 'USD' ? '$' : 'Bs')}
        </div>
        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded text-white uppercase backdrop-blur-sm">
          {account.currency}
        </span>
      </div>
      <h3 className="font-medium text-white/90 truncate pr-6">{account.name}</h3>
      <p className="text-2xl font-bold mt-1">
        {account.currency === 'USD' ? '$' : 'Bs.'} {account.balance.toLocaleString()}
      </p>

      {/* Edit Button */}
      <button 
        onClick={onEdit}
        className="absolute top-2 right-2 p-1.5 bg-black/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/30"
        title="Editar Cuenta"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
};