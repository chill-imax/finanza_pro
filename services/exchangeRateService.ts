export const getBCVRate = async (): Promise<number | null> => {
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.promedio;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null;
  }
};