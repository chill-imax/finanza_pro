import React, { useState, useEffect } from 'react';
import { Debt, Currency } from '../types';
import { X, Calendar } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../services/calendarService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Debt, 'id' | 'paidAmount' | 'isPaid'>) => void;
}

export const DebtModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const userCountry = localStorage.getItem('user_country') || 'Venezuela';
  const mainCurrency = localStorage.getItem('main_currency') || 'USD';

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'I_OWE' | 'OWES_ME'>('I_OWE');
  const [currency, setCurrency] = useState<Currency | string>(userCountry === 'Venezuela' ? Currency.USD : mainCurrency);
  const [dueDate, setDueDate] = useState('');

  // Asegurar que si abre y no es Venezuela, fuerce la moneda correcta
  useEffect(() => {
     if (isOpen) {
        setCurrency(userCountry === 'Venezuela' ? Currency.USD : mainCurrency);
     }
  }, [isOpen, userCountry, mainCurrency]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      amount: parseFloat(amount),
      type,
      currency: currency as Currency,
      dueDate: dueDate || undefined,
    });
    onClose();
    setName('');
    setAmount('');
    setDueDate('');
    setCurrency(userCountry === 'Venezuela' ? Currency.USD : mainCurrency);
  };

  const handleAddToCalendar = () => {
    if (!name || !dueDate) return;
    const title = type === 'I_OWE' ? `Pagar Deuda a ${name}` : `Cobrar Deuda a ${name}`;
    const details = `Monto: ${currency} ${amount}`;
    const url = generateGoogleCalendarUrl(title, details, dueDate);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-slate-800">Registrar Deuda</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setType('I_OWE')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'I_OWE' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-500'}`}
            >
              Yo Debo
            </button>
            <button
              type="button"
              onClick={() => setType('OWES_ME')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'OWES_ME' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500'}`}
            >
              Me Deben
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Persona / Entidad</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="0.00"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={userCountry !== 'Venezuela'}
                className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl ${userCountry !== 'Venezuela' ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {userCountry === 'Venezuela' ? (
                    <>
                        <option value={Currency.USD}>USD</option>
                        <option value={Currency.VES}>VES</option>
                    </>
                ) : (
                    <option value={mainCurrency}>{mainCurrency}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Límite (Opcional)</label>
            <div className="flex gap-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
                {dueDate && name && (
                  <button 
                    type="button" 
                    onClick={handleAddToCalendar}
                    className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200"
                    title="Agregar a Google Calendar"
                  >
                    <Calendar className="w-6 h-6" />
                  </button>
                )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg mt-2"
          >
            Guardar Deuda
          </button>
        </form>
      </div>
    </div>
  );
};