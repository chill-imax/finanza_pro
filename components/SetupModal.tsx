import React, { useState, useEffect } from 'react';
import { Globe, ArrowRight } from 'lucide-react';

interface Props {
  onSetupComplete: (country: string, currency: string) => void;
}

const HISPANIC_COUNTRIES = [
  { name: 'Venezuela', currency: 'VES' },
  { name: 'Argentina', currency: 'ARS' },
  { name: 'Bolivia', currency: 'BOB' },
  { name: 'Chile', currency: 'CLP' },
  { name: 'Colombia', currency: 'COP' },
  { name: 'Costa Rica', currency: 'CRC' },
  { name: 'Cuba', currency: 'CUP' },
  { name: 'Ecuador', currency: 'USD' },
  { name: 'El Salvador', currency: 'USD' },
  { name: 'España', currency: 'EUR' },
  { name: 'Guatemala', currency: 'GTQ' },
  { name: 'Honduras', currency: 'HNL' },
  { name: 'México', currency: 'MXN' },
  { name: 'Nicaragua', currency: 'NIO' },
  { name: 'Panamá', currency: 'USD' },
  { name: 'Paraguay', currency: 'PYG' },
  { name: 'Perú', currency: 'PEN' },
  { name: 'Puerto Rico', currency: 'USD' },
  { name: 'República Dominicana', currency: 'DOP' },
  { name: 'Uruguay', currency: 'UYU' },
  { name: 'Otro', currency: '' }
];

export const SetupModal: React.FC<Props> = ({ onSetupComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Venezuela');
  const [customCurrency, setCustomCurrency] = useState('');

  useEffect(() => {
    const isSetupComplete = localStorage.getItem('app_setup_complete');
    if (!isSetupComplete) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleStart = () => {
    let finalCurrency = 'USD'; // Por defecto
    
    if (selectedCountry === 'Venezuela') {
       finalCurrency = 'USD'; // Moneda base para Venezuela sigue siendo USD con VES secundario
    } else if (selectedCountry === 'Otro') {
       finalCurrency = customCurrency.toUpperCase() || 'USD';
    } else {
       const countryData = HISPANIC_COUNTRIES.find(c => c.name === selectedCountry);
       if (countryData) finalCurrency = countryData.currency;
    }

    localStorage.setItem('app_setup_complete', 'true');
    localStorage.setItem('user_country', selectedCountry);
    localStorage.setItem('main_currency', finalCurrency);
    
    onSetupComplete(selectedCountry, finalCurrency);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 animate-fade-in text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Bienvenido a FinanzaPro</h2>
        <p className="text-slate-500 text-sm mb-6">Selecciona tu país para configurar tu moneda local.</p>
        
        <div className="text-left mb-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">País</label>
            <select 
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              {HISPANIC_COUNTRIES.map(country => (
                <option key={country.name} value={country.name}>
                  {country.name} {country.name === 'Venezuela' ? '(Multimoneda)' : country.name !== 'Otro' ? `(${country.currency})` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedCountry === 'Otro' && (
            <div className="animate-fade-in">
               <label className="block text-sm font-bold text-slate-700 mb-2">Siglas de tu moneda (Ej. BRL, CAD)</label>
               <input 
                 type="text"
                 maxLength={3}
                 value={customCurrency}
                 onChange={(e) => setCustomCurrency(e.target.value)}
                 placeholder="USD"
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium uppercase"
               />
            </div>
          )}
        </div>

        <button 
          onClick={handleStart}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
          disabled={selectedCountry === 'Otro' && customCurrency.length < 2}
        >
          Comenzar <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};