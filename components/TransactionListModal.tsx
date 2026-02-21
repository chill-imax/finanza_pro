import React, { useState } from 'react';
import { Transaction, Category, Account, TransactionType, Currency } from '../types';
import { X, Filter, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onSelectTransaction: (t: Transaction) => void;
}

export const TransactionListModal: React.FC<Props> = ({ isOpen, onClose, transactions, categories, accounts, onSelectTransaction }) => {
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');

  if (!isOpen) return null;

  const filtered = transactions.filter(t => filterType === 'ALL' || t.type === filterType);

  const getCategoryName = (id: string, type: TransactionType) => {
    if (type === TransactionType.TRANSFER) return 'Transferencia';
    return categories.find(c => c.id === id)?.name || 'Desconocido';
  };

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Cuenta eliminada';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Historial de Movimientos</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 flex gap-2 overflow-x-auto shrink-0 border-b border-slate-50">
           <button onClick={() => setFilterType('ALL')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterType === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
           <button onClick={() => setFilterType(TransactionType.INCOME)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterType === TransactionType.INCOME ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Ingresos</button>
           <button onClick={() => setFilterType(TransactionType.EXPENSE)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterType === TransactionType.EXPENSE ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Gastos</button>
           <button onClick={() => setFilterType(TransactionType.TRANSFER)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterType === TransactionType.TRANSFER ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Transferencias</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filtered.length === 0 ? (
                <div className="text-center text-slate-400 py-10">No hay transacciones</div>
            ) : (
                filtered.map(tx => (
                    <div 
                        key={tx.id} 
                        onClick={() => onSelectTransaction(tx)}
                        className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : tx.type === 'TRANSFER' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                {tx.type === 'INCOME' ? <ArrowUpCircle className="w-5 h-5" /> : tx.type === 'TRANSFER' ? <ArrowRightLeft className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{getCategoryName(tx.categoryId, tx.type)}</p>
                                <p className="text-[10px] text-slate-500">{tx.date} • {getAccountName(tx.accountId)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className={`font-bold block ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {tx.type === 'INCOME' ? '+' : '-'}{tx.currency === 'USD' ? '$' : 'Bs.'}{tx.amount.toLocaleString()}
                            </span>
                            {tx.type === TransactionType.TRANSFER && tx.toAccountId && (
                                <span className="text-[10px] text-blue-500">→ {getAccountName(tx.toAccountId)}</span>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};