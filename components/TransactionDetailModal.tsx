import React from 'react';
import { Transaction, Category, Account, TransactionType } from '../types';
import { X, Trash2, Calendar, FileText, Wallet } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  categories: Category[];
  accounts: Account[];
  onDelete: (id: string) => void;
}

export const TransactionDetailModal: React.FC<Props> = ({ isOpen, onClose, transaction, categories, accounts, onDelete }) => {
  if (!isOpen || !transaction) return null;

  const category = categories.find(c => c.id === transaction.categoryId);
  const account = accounts.find(a => a.id === transaction.accountId);
  const toAccount = accounts.find(a => a.id === transaction.toAccountId);

  const handleDelete = () => {
      // Trigger delete in parent. Parent is responsible for showing confirmation modal.
      // We do not close the modal immediately here; it will close when the transaction 
      // is actually deleted (parent sets selectedTransaction to null)
      onDelete(transaction.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">Detalle</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 text-center border-b border-slate-50">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 text-3xl ${transaction.type === 'INCOME' ? 'bg-emerald-100' : transaction.type === 'TRANSFER' ? 'bg-blue-100' : 'bg-red-100'}`}>
                {transaction.type === 'TRANSFER' ? '↔️' : category?.icon || '📄'}
            </div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">
                {transaction.type === 'TRANSFER' ? 'Transferencia' : category?.name}
            </p>
            <p className={`text-3xl font-black mt-1 ${transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'}`}>
                {transaction.currency === 'USD' ? '$' : 'Bs.'} {transaction.amount.toLocaleString()}
            </p>
        </div>

        <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Fecha</p>
                    <p className="text-slate-700 font-medium">{transaction.date}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                    <p className="text-xs text-slate-400 font-bold uppercase">Cuenta</p>
                    <p className="text-slate-700 font-medium">{account?.name || 'Desconocida'}</p>
                    {toAccount && (
                        <p className="text-xs text-blue-500 mt-0.5">→ Enviado a: {toAccount.name}</p>
                    )}
                </div>
            </div>

            {transaction.note && (
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Nota</p>
                        <p className="text-slate-700 font-medium italic">"{transaction.note}"</p>
                    </div>
                </div>
            )}

             {transaction.exchangeRate && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                    ℹ️ Tasa de cambio aplicada: {transaction.exchangeRate}
                </div>
            )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button 
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-3 hover:bg-red-50 rounded-xl transition-colors"
            >
                <Trash2 className="w-5 h-5" /> Eliminar Transacción
            </button>
        </div>
      </div>
    </div>
  );
};