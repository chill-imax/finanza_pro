export const getBCVRate = async (): Promise<number | null> => {
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    
    // GUARDAR EN CACHE: Si la petición fue exitosa, guardamos la tasa localmente
    localStorage.setItem('last_bcv_rate', data.promedio.toString());
    
    return data.promedio;
  } catch (error) {
    console.warn("Estás offline o el API falló. Usando la última tasa guardada...");
    
    // RECUPERAR DE CACHE: Si no hay internet, usamos la última tasa conocida
    const cachedRate = localStorage.getItem('last_bcv_rate');
    if (cachedRate) {
        return parseFloat(cachedRate);
    }
    
    // Si es la primera vez que abre la app, no hay internet y no hay caché:
    return null;
  }
};