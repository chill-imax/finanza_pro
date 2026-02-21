import { GoogleGenAI } from "@google/genai";
import { Transaction, Account, Debt, Currency } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getFinancialAdvice = async (
  transactions: Transaction[],
  accounts: Account[],
  debts: Debt[]
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Configura tu API KEY para recibir consejos de IA.";

  // Simplify data for the prompt to save tokens
  const recentTransactions = transactions.slice(0, 50).map(t => ({
    type: t.type,
    amount: t.amount,
    currency: t.currency,
    date: t.date,
    category: t.categoryId, // In a real app we'd map ID to name
  }));

  const accountSummary = accounts.map(a => `${a.name} (${a.currency}): ${a.balance}`).join(', ');
  const debtSummary = debts.filter(d => !d.isPaid).map(d => `${d.type === 'I_OWE' ? 'Debo' : 'Me deben'} ${d.amount} ${d.currency} a ${d.name}`).join(', ');

  const prompt = `
    Actúa como un asesor financiero experto para un usuario en Venezuela que maneja una economía multimoneda (VES y USD).
    
    Aquí está mi resumen financiero actual:
    Cuentas: ${accountSummary}
    Deudas Pendientes: ${debtSummary || 'Ninguna'}
    Últimas transacciones: ${JSON.stringify(recentTransactions)}

    Por favor dame 3 consejos breves, directos y accionables para mejorar mi situación financiera, considerando la inflación y la devaluación si aplica.
    Enfócate en ahorro, control de deuda y optimización del gasto.
    Formato: Lista numerada.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No se pudo generar un consejo en este momento.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Ocurrió un error al consultar a tu asesor financiero.";
  }
};
