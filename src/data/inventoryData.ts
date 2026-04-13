export type ItemStatus = 'OK' | 'Low' | 'Urgent';

export interface InventoryItem {
  id: number;
  name: string;
  qty: string;
  rawQty: number;
  status: ItemStatus;
  icon: string;
  unit: string;
  step: number;
}

export type RequestStatus = 'pending' | 'acknowledged' | 'dispatched';

export interface AdminRequest {
  id: string;
  row: string;
  time: string;
  items: string;
  status: RequestStatus;
}

// Core 9 distributor items
export const CORE_ITEMS: InventoryItem[] = [
  { id: 1, name: 'Havan Samagri Mix', qty: '850g',  rawQty: 850,  status: 'OK',     icon: '🌿', unit: 'g',    step: 50  },
  { id: 2, name: 'Ghee',              qty: '1.2L',  rawQty: 1.2,  status: 'OK',     icon: '🧈', unit: 'L',    step: 0.1 },
  { id: 3, name: 'Wood (Samidha)',    qty: '18 pcs',rawQty: 18,   status: 'Low',    icon: '🪵', unit: 'pcs',  step: 1   },
  { id: 4, name: 'Camphor (Kapoor)', qty: '24 pcs',rawQty: 24,   status: 'OK',     icon: '🕯', unit: 'pcs',  step: 1   },
  { id: 5, name: 'Cow Dung Cakes',   qty: '6 pcs', rawQty: 6,    status: 'Urgent', icon: '🟤', unit: 'pcs',  step: 1   },
  { id: 6, name: 'Rice (Akshat)',    qty: '400g',  rawQty: 400,  status: 'Low',    icon: '🍚', unit: 'g',    step: 50  },
  { id: 7, name: 'Jaggery (Gud)',    qty: '300g',  rawQty: 300,  status: 'OK',     icon: '🍬', unit: 'g',    step: 50  },
  { id: 8, name: 'Til (Sesame Seeds)',qty: '180g', rawQty: 180,  status: 'Urgent', icon: '🌾', unit: 'g',    step: 50  },
  { id: 9, name: 'Barley (Jau)',     qty: '220g',  rawQty: 220,  status: 'Low',    icon: '🌾', unit: 'g',    step: 50  },
];

// Extra admin warehouse items (IDs 101–111)
export interface ExtraItem {
  id: number;
  name: string;
  unit: string;
  step: number;
  icon: string;
}

export const EXTRA_ITEMS: ExtraItem[] = [
  { id: 101, name: 'Flowers & Garlands',    unit: 'pcs', step: 5,   icon: '🌸' },
  { id: 102, name: 'Haldi & Kumkum',        unit: 'g',   step: 50,  icon: '🏵' },
  { id: 103, name: 'Chandan',               unit: 'g',   step: 20,  icon: '🪵' },
  { id: 104, name: 'Dhoop / Agarbatti',     unit: 'pkts',step: 1,   icon: '💨' },
  { id: 105, name: 'Diya',                  unit: 'pcs', step: 2,   icon: '🪔' },
  { id: 106, name: 'Fruits & Sweets',       unit: 'kg',  step: 0.5, icon: '🍎' },
  { id: 107, name: 'Coconut (Nariyal)',     unit: 'pcs', step: 1,   icon: '🥥' },
  { id: 108, name: 'Betel Leaves & Supari', unit: 'pcs', step: 10,  icon: '🍃' },
  { id: 109, name: 'Dry Fruits',            unit: 'kg',  step: 0.1, icon: '🥜' },
  { id: 110, name: 'Honey',                 unit: 'g',   step: 50,  icon: '🍯' },
  { id: 111, name: 'Milk / Curd',           unit: 'L',   step: 0.5, icon: '🥛' },
];

// Pre-seeded admin requests
export const INITIAL_REQUESTS: AdminRequest[] = [
  { id: '1', row: '07', time: '10:42 AM', items: 'Ghee',                              status: 'pending'   },
  { id: '2', row: '12', time: '10:15 AM', items: 'Wood (Samidha), Camphor (Kapoor)', status: 'pending'   },
  { id: '3', row: '14', time: '09:30 AM', items: 'Havan Samagri Mix',                status: 'dispatched' },
  { id: '4', row: '02', time: '09:12 AM', items: 'Til (Sesame Seeds), Barley (Jau)', status: 'dispatched' },
];

// Row color groups
export const ROW_COLORS: Record<number, string> = {
  1:  '#2ECC71', 4:  '#2ECC71', 7:  '#2ECC71', 10: '#2ECC71', 13: '#2ECC71',
  2:  '#F39C12', 5:  '#F39C12', 8:  '#F39C12', 11: '#F39C12', 14: '#F39C12',
  3:  '#E74C3C', 6:  '#E74C3C', 9:  '#E74C3C', 12: '#E74C3C', 15: '#E74C3C',
};
