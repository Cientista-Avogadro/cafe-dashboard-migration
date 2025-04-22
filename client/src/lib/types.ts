// Farm type
export interface Farm {
  id: number;
  name: string;
  location: string;
  area: number;
  cultivated_area: number;
  crops: string[];
  employees: number;
  status: string;
  image: string;
}

// Alert type
export interface Alert {
  id: number;
  type: string;
  message: string;
  location: string;
  icon: string;
  severity: string;
}

// Activity type
export interface Activity {
  id: number;
  date: string;
  activity: string;
  farm: string;
  responsible: string;
  status: string;
}

// Financial data type
export interface FinancialData {
  months: string[];
  income: number[];
  expenses: number[];
}

// Production data type
export interface ProductionData {
  crop: string;
  percentage: number;
  color: string;
}

// Sector type
export interface Sector {
  id: number;
  name: string;
  farm_id: number;
  farm_name: string;
  area: number;
  current_crop: string;
  status: string;
}

// Lot type
export interface Lot {
  id: number;
  name: string;
  sector_id: number;
  sector_name: string;
  area: number;
  current_crop: string;
  planting_date: string;
  expected_harvest_date: string;
  status: string;
}

// Crop type
export interface Crop {
  id: number;
  name: string;
  variety: string;
  cycle_days: number;
  yield_per_hectare: number;
  planting_season_start: string;
  planting_season_end: string;
}

// Input type
export interface Input {
  id: number;
  name: string;
  type: string;
  unit: string;
  stock: number;
  price_per_unit: number;
  supplier: string;
  last_purchase_date: string;
}

// Irrigation type
export interface Irrigation {
  id: number;
  date: string;
  farm_id: number;
  farm_name: string;
  sector_id: number;
  sector_name: string;
  volume: number;
  duration: number;
  responsible: string;
  notes: string;
}

// Pest type
export interface Pest {
  id: number;
  name: string;
  affected_crops: string[];
  detection_date: string;
  status: string;
  severity: string;
  treatment: string;
  farm_id: number;
  farm_name: string;
  sector_id: number;
  sector_name: string;
}

// Transaction type
export interface Transaction {
  id: number;
  date: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  farm_id: number;
  farm_name: string;
  payment_method: string;
}
