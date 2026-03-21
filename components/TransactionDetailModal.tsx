import React from 'react';
import { Transaction, Category, Account, TransactionType } from '../types';
import { X, Trash2, Calendar, FileText, Wallet, Edit2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  categories: Category[];
  accounts: Account[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export const TransactionDetailModal: React.FC<Props> = ({ isOpen, onClose, transaction, categories, accounts, onDelete, onEdit }) => {
  if (!isOpen || !transaction) return null;

  const category = categories.find(c => c.id === transaction.categoryId);
  const account = accounts.find(a => a.id === transaction.accountId);
  const toAccount = accounts.find(a => a.id === transaction.toAccountId);

  // ULTRA ROBUSTO: Detectamos si es deuda por ID, categoría, o texto en la nota
  const isDebtPayment = 
    String(transaction.categoryId) === '10' || 
    !!transaction.linkedDebtId || 
    (transaction.note && transaction.note.toLowerCase().includes('deuda'));

  const handleDelete = () => {
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
                {transaction.type === 'TRANSFER' ? '↔️' : isDebtPayment ? '🤝' : category?.icon || '📄'}
            </div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">
                {transaction.type === 'TRANSFER' ? 'Transferencia' : isDebtPayment ? 'Abono de Deuda' : category?.name}
            </p>
            <p className={`text-3xl font-black mt-1 ${transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'}`}>
                {transaction.currency === 'USD' ? '$' : 'Bs.'} {transaction.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            
            {transaction.currency === 'VES' && transaction.exchangeRate && transaction.exchangeRate > 0 && (
                <p className="text-sm font-bold text-slate-400 mt-1">
                    ≈ ${(transaction.amount / transaction.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </p>
            )}
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
                    ℹ️ Tasa de cambio registrada: Bs. {transaction.exchangeRate} / USD
                </div>
            )}

            {isDebtPayment && (
               <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Por motivos de consistencia en los saldos, los abonos a deudas no pueden ser editados. Solo puedes eliminarlos.
                  </p>
               </div>
            )}
        </div>

        <div className="flex gap-2 p-4 bg-slate-50 border-t border-slate-100">
            {/* Oculta completamente el botón de edición si es un pago de deuda */}
            {!isDebtPayment && (
                <button 
                    onClick={() => onEdit(transaction)}
                    className="w-1/2 flex items-center justify-center gap-2 text-blue-600 font-bold py-3 hover:bg-blue-50 rounded-xl transition-colors"
                >
                    <Edit2 className="w-5 h-5" /> Editar
                </button>
            )}
            <button 
                onClick={handleDelete}
                className={`${isDebtPayment ? 'w-full' : 'w-1/2'} flex items-center justify-center gap-2 text-red-500 font-bold py-3 hover:bg-red-50 rounded-xl transition-colors`}
            >
                <Trash2 className="w-5 h-5" /> Eliminar
            </button>
        </div>
      </div>
    </div>
  );
};