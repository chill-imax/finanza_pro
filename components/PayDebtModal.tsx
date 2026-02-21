import React, { useState, useEffect } from 'react';
import { Debt, Account, Currency } from '../types';
import { X, ArrowRight, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  accounts: Account[];
  onConfirm: (amount: number, accountId: string, exchangeRate?: number) => void;
  currentExchangeRate: number;
}

export const PayDebtModal: React.FC<Props> = ({ isOpen, onClose, debt, accounts, onConfirm, currentExchangeRate }) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [customRate, setCustomRate] = useState('');

  useEffect(() => {
    if (isOpen && debt) {
      setAmount((debt.amount - debt.paidAmount).toString());
      // Try to find same currency account first, else default to first
      const matchingAccount = accounts.find(a => a.currency === debt.currency);
      setAccountId(matchingAccount?.id || accounts[0]?.id || '');
      setCustomRate(currentExchangeRate.toString());
    }
  }, [isOpen, debt, accounts, currentExchangeRate]);

  if (!isOpen || !debt) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(parseFloat(amount), accountId, parseFloat(customRate));
    setAmount('');
  };

  const selectedAccount = accounts.find(a => a.id === accountId);
  const isPaying = debt.type === 'I_OWE';
  const isMultiCurrency = selectedAccount && selectedAccount.currency !== debt.currency;

  const getConversionPreview = () => {
    if (!amount || !selectedAccount) return null;
    const val = parseFloat(amount);
    const rate = parseFloat(customRate) || currentExchangeRate;

    let convertedAmount = 0;
    // Debt is USD, Paying with VES -> Cost is Amount * Rate
    if (debt.currency === Currency.USD && selectedAccount.currency === Currency.VES) {
        convertedAmount = val * rate;
    }
    // Debt is VES, Paying with USD -> Cost is Amount / Rate
    else if (debt.currency === Currency.VES && selectedAccount.currency === Currency.USD) {
        convertedAmount = val / rate;
    }

    return (
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-2 text-sm">
            <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                <RefreshCw className="w-4 h-4" /> Conversión
            </div>
            <div className="flex justify-between">
                <span>Monto Deuda:</span>
                <span className="font-mono">{debt.currency} {val}</span>
            </div>
            <div className="flex justify-between font-bold text-blue-700 mt-1 pt-1 border-t border-blue-200">
                <span>{isPaying ? 'Se descontará:' : 'Se depositará:'}</span>
                <span>{selectedAccount.currency} {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
        </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">
            {isPaying ? 'Abonar a Deuda' : 'Registrar Cobro'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
            <p className="text-xs text-slate-500 mb-1">{isPaying ? 'Deuda con' : 'Deuda de'}</p>
            <p className="font-bold text-lg text-slate-800">{debt.name}</p>
            <div className="flex justify-between mt-2 text-sm">
                <span className="text-slate-500">Restante:</span>
                <span className="font-bold">{debt.currency} {(debt.amount - debt.paidAmount).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto a {isPaying ? 'Pagar' : 'Cobrar'} ({debt.currency})</label>
            <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {debt.currency === 'USD' ? '$' : 'Bs.'}
              </span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                max={debt.amount - debt.paidAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg font-bold"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">
                {isPaying ? 'Pagar desde Cuenta' : 'Depositar en Cuenta'}
             </label>
             <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
             >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency}) - Saldo: {acc.currency === 'USD' ? '$' : 'Bs.'}{acc.balance.toLocaleString()}
                  </option>
                ))}
             </select>
          </div>

          {isMultiCurrency && (
             <div className="space-y-3">
                 <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Tasa de Cambio (Bs/USD)</label>
                   <input 
                      type="number"
                      step="0.01"
                      required
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                   />
                 </div>
                 {getConversionPreview()}
             </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 text-white font-bold rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2 ${isPaying ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
             {isPaying ? 'Confirmar Pago' : 'Confirmar Cobro'} <ArrowRight className="w-5 h-5"/>
          </button>
        </form>
      </div>
    </div>
  );
};