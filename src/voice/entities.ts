export const ENTITY_TYPES = {
  quantity: { description: 'Energy quantity in kWh', unit: 'kWh' },
  price: { description: 'Price per unit', unit: '₹/kWh' },
  time_window: { description: 'Time range for energy delivery' },
  meter_id: { description: 'Meter identifier' },
  source_type: { description: 'Energy source type', values: ['solar', 'wind', 'battery', 'grid'] }
};
