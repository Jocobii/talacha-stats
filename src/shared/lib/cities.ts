// Mexican cities where amateur football leagues typically operate.
// Grouped by state for readability; exported as a flat sorted array.

const CITIES_BY_STATE: Record<string, string[]> = {
  "Baja California":     ["Tijuana", "Mexicali", "Ensenada", "Tecate", "Rosarito"],
  "Baja California Sur": ["La Paz", "Los Cabos"],
  "Sonora":              ["Hermosillo", "Ciudad Obregón", "Nogales", "Guaymas", "Navojoa"],
  "Sinaloa":             ["Culiacán", "Mazatlán", "Los Mochis", "Guasave"],
  "Chihuahua":           ["Ciudad Juárez", "Chihuahua", "Delicias", "Parral"],
  "Coahuila":            ["Torreón", "Saltillo", "Monclova", "Piedras Negras"],
  "Nuevo León":          ["Monterrey", "San Nicolás de los Garza", "Guadalupe", "Apodaca", "San Pedro Garza García"],
  "Tamaulipas":          ["Reynosa", "Matamoros", "Tampico", "Nuevo Laredo", "Victoria"],
  "Jalisco":             ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Puerto Vallarta"],
  "Aguascalientes":      ["Aguascalientes"],
  "Guanajuato":          ["León", "Irapuato", "Celaya", "Salamanca", "Guanajuato"],
  "Michoacán":           ["Morelia", "Uruapan", "Zamora", "Lázaro Cárdenas"],
  "Colima":              ["Colima", "Manzanillo"],
  "Nayarit":             ["Tepic", "Bahía de Banderas"],
  "Zacatecas":           ["Zacatecas", "Fresnillo"],
  "San Luis Potosí":     ["San Luis Potosí", "Ciudad Valles"],
  "Durango":             ["Durango", "Gómez Palacio"],
  "Ciudad de México":    ["Ciudad de México"],
  "Estado de México":    ["Ecatepec", "Naucalpan", "Tlalnepantla", "Toluca", "Nezahualcóyotl", "Chimalhuacán"],
  "Hidalgo":             ["Pachuca", "Tulancingo"],
  "Morelos":             ["Cuernavaca", "Cuautla"],
  "Querétaro":           ["Querétaro", "San Juan del Río"],
  "Puebla":              ["Puebla", "Tehuacán"],
  "Tlaxcala":            ["Tlaxcala"],
  "Veracruz":            ["Veracruz", "Xalapa", "Coatzacoalcos", "Córdoba", "Poza Rica"],
  "Guerrero":            ["Acapulco", "Chilpancingo", "Zihuatanejo"],
  "Oaxaca":              ["Oaxaca", "Salina Cruz"],
  "Chiapas":             ["Tuxtla Gutiérrez", "San Cristóbal de las Casas", "Tapachula"],
  "Tabasco":             ["Villahermosa", "Cárdenas"],
  "Campeche":            ["Campeche", "Ciudad del Carmen"],
  "Yucatán":             ["Mérida", "Valladolid"],
  "Quintana Roo":        ["Cancún", "Playa del Carmen", "Chetumal", "Tulum"],
};

// Flat sorted list (alphabetical) — used for dropdowns
export const MEXICO_CITIES: string[] = Object.values(CITIES_BY_STATE)
  .flat()
  .sort((a, b) => a.localeCompare(b, "es"));

// Structured list — used for grouped selects if needed in the future
export const MEXICO_CITIES_BY_STATE = CITIES_BY_STATE;

export const DEFAULT_CITY = "Tijuana";

export function isMexicoCity(city: string): boolean {
  return MEXICO_CITIES.includes(city);
}
