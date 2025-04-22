import {
  users, farms, sectors, lots, crops, inputs, irrigations, pests, transactions, activities,
  type User, type InsertUser, type Farm, type InsertFarm, type Sector, type InsertSector,
  type Lot, type InsertLot, type Crop, type InsertCrop, type Input, type InsertInput,
  type Irrigation, type InsertIrrigation, type Pest, type InsertPest,
  type Transaction, type InsertTransaction, type Activity, type InsertActivity
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Farm methods
  getFarms(userId?: number): Promise<Farm[]>;
  getFarm(id: number): Promise<Farm | undefined>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: number, farm: Partial<InsertFarm>): Promise<Farm | undefined>;
  deleteFarm(id: number): Promise<boolean>;
  
  // Sector methods
  getSectors(farmId?: number): Promise<Sector[]>;
  getSector(id: number): Promise<Sector | undefined>;
  createSector(sector: InsertSector): Promise<Sector>;
  updateSector(id: number, sector: Partial<InsertSector>): Promise<Sector | undefined>;
  deleteSector(id: number): Promise<boolean>;
  
  // Lot methods
  getLots(sectorId?: number): Promise<Lot[]>;
  getLot(id: number): Promise<Lot | undefined>;
  createLot(lot: InsertLot): Promise<Lot>;
  updateLot(id: number, lot: Partial<InsertLot>): Promise<Lot | undefined>;
  deleteLot(id: number): Promise<boolean>;
  
  // Crop methods
  getCrops(): Promise<Crop[]>;
  getCrop(id: number): Promise<Crop | undefined>;
  createCrop(crop: InsertCrop): Promise<Crop>;
  updateCrop(id: number, crop: Partial<InsertCrop>): Promise<Crop | undefined>;
  deleteCrop(id: number): Promise<boolean>;
  
  // Input methods
  getInputs(): Promise<Input[]>;
  getInput(id: number): Promise<Input | undefined>;
  createInput(input: InsertInput): Promise<Input>;
  updateInput(id: number, input: Partial<InsertInput>): Promise<Input | undefined>;
  deleteInput(id: number): Promise<boolean>;
  
  // Irrigation methods
  getIrrigations(farmId?: number): Promise<Irrigation[]>;
  getIrrigation(id: number): Promise<Irrigation | undefined>;
  createIrrigation(irrigation: InsertIrrigation): Promise<Irrigation>;
  updateIrrigation(id: number, irrigation: Partial<InsertIrrigation>): Promise<Irrigation | undefined>;
  deleteIrrigation(id: number): Promise<boolean>;
  
  // Pest methods
  getPests(farmId?: number): Promise<Pest[]>;
  getPest(id: number): Promise<Pest | undefined>;
  createPest(pest: InsertPest): Promise<Pest>;
  updatePest(id: number, pest: Partial<InsertPest>): Promise<Pest | undefined>;
  deletePest(id: number): Promise<boolean>;
  
  // Transaction methods
  getTransactions(farmId?: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Activity methods
  getActivities(farmId?: number): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  
  // Dashboard data
  getDashboardData(userId: number): Promise<any>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private farms: Map<number, Farm>;
  private sectors: Map<number, Sector>;
  private lots: Map<number, Lot>;
  private crops: Map<number, Crop>;
  private inputs: Map<number, Input>;
  private irrigations: Map<number, Irrigation>;
  private pests: Map<number, Pest>;
  private transactions: Map<number, Transaction>;
  private activities: Map<number, Activity>;
  
  currentUserId: number;
  currentFarmId: number;
  currentSectorId: number;
  currentLotId: number;
  currentCropId: number;
  currentInputId: number;
  currentIrrigationId: number;
  currentPestId: number;
  currentTransactionId: number;
  currentActivityId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.farms = new Map();
    this.sectors = new Map();
    this.lots = new Map();
    this.crops = new Map();
    this.inputs = new Map();
    this.irrigations = new Map();
    this.pests = new Map();
    this.transactions = new Map();
    this.activities = new Map();
    
    this.currentUserId = 1;
    this.currentFarmId = 1;
    this.currentSectorId = 1;
    this.currentLotId = 1;
    this.currentCropId = 1;
    this.currentInputId = 1;
    this.currentIrrigationId = 1;
    this.currentPestId = 1;
    this.currentTransactionId = 1;
    this.currentActivityId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id } as User;
    this.users.set(id, user);
    return user;
  }
  
  // Farm methods
  async getFarms(userId?: number): Promise<Farm[]> {
    const farms = Array.from(this.farms.values());
    if (userId) {
      return farms.filter(farm => farm.user_id === userId);
    }
    return farms;
  }
  
  async getFarm(id: number): Promise<Farm | undefined> {
    return this.farms.get(id);
  }
  
  async createFarm(farm: InsertFarm): Promise<Farm> {
    const id = this.currentFarmId++;
    const newFarm: Farm = { ...farm, id } as Farm;
    this.farms.set(id, newFarm);
    return newFarm;
  }
  
  async updateFarm(id: number, farmData: Partial<InsertFarm>): Promise<Farm | undefined> {
    const farm = this.farms.get(id);
    if (!farm) return undefined;
    
    const updatedFarm = { ...farm, ...farmData };
    this.farms.set(id, updatedFarm);
    return updatedFarm;
  }
  
  async deleteFarm(id: number): Promise<boolean> {
    return this.farms.delete(id);
  }
  
  // Sector methods
  async getSectors(farmId?: number): Promise<Sector[]> {
    const sectors = Array.from(this.sectors.values());
    if (farmId) {
      return sectors.filter(sector => sector.farm_id === farmId);
    }
    return sectors;
  }
  
  async getSector(id: number): Promise<Sector | undefined> {
    return this.sectors.get(id);
  }
  
  async createSector(sector: InsertSector): Promise<Sector> {
    const id = this.currentSectorId++;
    const newSector: Sector = { ...sector, id } as Sector;
    this.sectors.set(id, newSector);
    return newSector;
  }
  
  async updateSector(id: number, sectorData: Partial<InsertSector>): Promise<Sector | undefined> {
    const sector = this.sectors.get(id);
    if (!sector) return undefined;
    
    const updatedSector = { ...sector, ...sectorData };
    this.sectors.set(id, updatedSector);
    return updatedSector;
  }
  
  async deleteSector(id: number): Promise<boolean> {
    return this.sectors.delete(id);
  }
  
  // Lot methods
  async getLots(sectorId?: number): Promise<Lot[]> {
    const lots = Array.from(this.lots.values());
    if (sectorId) {
      return lots.filter(lot => lot.sector_id === sectorId);
    }
    return lots;
  }
  
  async getLot(id: number): Promise<Lot | undefined> {
    return this.lots.get(id);
  }
  
  async createLot(lot: InsertLot): Promise<Lot> {
    const id = this.currentLotId++;
    const newLot: Lot = { ...lot, id } as Lot;
    this.lots.set(id, newLot);
    return newLot;
  }
  
  async updateLot(id: number, lotData: Partial<InsertLot>): Promise<Lot | undefined> {
    const lot = this.lots.get(id);
    if (!lot) return undefined;
    
    const updatedLot = { ...lot, ...lotData };
    this.lots.set(id, updatedLot);
    return updatedLot;
  }
  
  async deleteLot(id: number): Promise<boolean> {
    return this.lots.delete(id);
  }
  
  // Crop methods
  async getCrops(): Promise<Crop[]> {
    return Array.from(this.crops.values());
  }
  
  async getCrop(id: number): Promise<Crop | undefined> {
    return this.crops.get(id);
  }
  
  async createCrop(crop: InsertCrop): Promise<Crop> {
    const id = this.currentCropId++;
    const newCrop: Crop = { ...crop, id } as Crop;
    this.crops.set(id, newCrop);
    return newCrop;
  }
  
  async updateCrop(id: number, cropData: Partial<InsertCrop>): Promise<Crop | undefined> {
    const crop = this.crops.get(id);
    if (!crop) return undefined;
    
    const updatedCrop = { ...crop, ...cropData };
    this.crops.set(id, updatedCrop);
    return updatedCrop;
  }
  
  async deleteCrop(id: number): Promise<boolean> {
    return this.crops.delete(id);
  }
  
  // Input methods
  async getInputs(): Promise<Input[]> {
    return Array.from(this.inputs.values());
  }
  
  async getInput(id: number): Promise<Input | undefined> {
    return this.inputs.get(id);
  }
  
  async createInput(input: InsertInput): Promise<Input> {
    const id = this.currentInputId++;
    const newInput: Input = { ...input, id } as Input;
    this.inputs.set(id, newInput);
    return newInput;
  }
  
  async updateInput(id: number, inputData: Partial<InsertInput>): Promise<Input | undefined> {
    const input = this.inputs.get(id);
    if (!input) return undefined;
    
    const updatedInput = { ...input, ...inputData };
    this.inputs.set(id, updatedInput);
    return updatedInput;
  }
  
  async deleteInput(id: number): Promise<boolean> {
    return this.inputs.delete(id);
  }
  
  // Irrigation methods
  async getIrrigations(farmId?: number): Promise<Irrigation[]> {
    const irrigations = Array.from(this.irrigations.values());
    if (farmId) {
      return irrigations.filter(irrigation => irrigation.farm_id === farmId);
    }
    return irrigations;
  }
  
  async getIrrigation(id: number): Promise<Irrigation | undefined> {
    return this.irrigations.get(id);
  }
  
  async createIrrigation(irrigation: InsertIrrigation): Promise<Irrigation> {
    const id = this.currentIrrigationId++;
    const newIrrigation: Irrigation = { ...irrigation, id } as Irrigation;
    this.irrigations.set(id, newIrrigation);
    return newIrrigation;
  }
  
  async updateIrrigation(id: number, irrigationData: Partial<InsertIrrigation>): Promise<Irrigation | undefined> {
    const irrigation = this.irrigations.get(id);
    if (!irrigation) return undefined;
    
    const updatedIrrigation = { ...irrigation, ...irrigationData };
    this.irrigations.set(id, updatedIrrigation);
    return updatedIrrigation;
  }
  
  async deleteIrrigation(id: number): Promise<boolean> {
    return this.irrigations.delete(id);
  }
  
  // Pest methods
  async getPests(farmId?: number): Promise<Pest[]> {
    const pests = Array.from(this.pests.values());
    if (farmId) {
      return pests.filter(pest => pest.farm_id === farmId);
    }
    return pests;
  }
  
  async getPest(id: number): Promise<Pest | undefined> {
    return this.pests.get(id);
  }
  
  async createPest(pest: InsertPest): Promise<Pest> {
    const id = this.currentPestId++;
    const newPest: Pest = { ...pest, id } as Pest;
    this.pests.set(id, newPest);
    return newPest;
  }
  
  async updatePest(id: number, pestData: Partial<InsertPest>): Promise<Pest | undefined> {
    const pest = this.pests.get(id);
    if (!pest) return undefined;
    
    const updatedPest = { ...pest, ...pestData };
    this.pests.set(id, updatedPest);
    return updatedPest;
  }
  
  async deletePest(id: number): Promise<boolean> {
    return this.pests.delete(id);
  }
  
  // Transaction methods
  async getTransactions(farmId?: number): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values());
    if (farmId) {
      return transactions.filter(transaction => transaction.farm_id === farmId);
    }
    return transactions;
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const newTransaction: Transaction = { ...transaction, id } as Transaction;
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async updateTransaction(id: number, transactionData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...transactionData };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }
  
  // Activity methods
  async getActivities(farmId?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values());
    if (farmId) {
      return activities.filter(activity => activity.farm_id === farmId);
    }
    return activities;
  }
  
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const newActivity: Activity = { ...activity, id } as Activity;
    this.activities.set(id, newActivity);
    return newActivity;
  }
  
  async updateActivity(id: number, activityData: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    
    const updatedActivity = { ...activity, ...activityData };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }
  
  async deleteActivity(id: number): Promise<boolean> {
    return this.activities.delete(id);
  }
  
  // Dashboard data
  async getDashboardData(userId: number): Promise<any> {
    const userFarms = await this.getFarms(userId);
    
    // Calculate total stats
    const farmCount = userFarms.length;
    
    // Sum up cultivated area across all farms
    const cultivatedArea = userFarms.reduce((total, farm) => {
      return total + Number(farm.cultivated_area || 0);
    }, 0);
    
    // Get unique crops across all farms
    const activeCrops = new Set<string>();
    userFarms.forEach(farm => {
      if (farm.crops && Array.isArray(farm.crops)) {
        farm.crops.forEach(crop => activeCrops.add(crop));
      }
    });
    
    // Get recent activities
    const activities = await this.getActivities();
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    // Get recent alerts
    // In a real app, this would come from a dedicated alerts table
    // For the demo, we're creating sample alerts
    
    // Calculate financial data
    // In a real app, this would be calculated from actual transactions
    // For the demo, we're creating sample financial data
    
    return {
      stats: {
        farmCount,
        cultivatedArea,
        activeCrops: activeCrops.size,
        alertCount: 4 // Sample alert count
      },
      farms: userFarms.slice(0, 3), // Latest 3 farms
      activities: sortedActivities,
      // Sample data for the rest of dashboard - would be calculated from actual data in real app
      alerts: [
        {
          id: 1,
          type: "pest",
          message: "Detecção de praga em Milho",
          location: "Fazenda Boa Vista - Setor A",
          icon: "ri-bug-line",
          severity: "warning"
        },
        {
          id: 2,
          type: "irrigation",
          message: "Irrigação abaixo do ideal",
          location: "Fazenda Santa Luzia - Setor B",
          icon: "ri-drop-line",
          severity: "error"
        },
        {
          id: 3,
          type: "inventory",
          message: "Insumo com estoque baixo",
          location: "Fertilizante NPK - 2 unidades",
          icon: "ri-shopping-basket-2-line",
          severity: "info"
        },
        {
          id: 4,
          type: "harvest",
          message: "Colheita Programada",
          location: "Tomate - Sítio Renascer (5 dias)",
          icon: "ri-calendar-check-line",
          severity: "primary"
        }
      ],
      financialData: {
        months: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
        income: [15000, 18000, 21000, 17000, 25000, 22000],
        expenses: [8000, 9000, 14000, 11000, 16000, 13000]
      },
      productionData: [
        { crop: "Milho", percentage: 35, color: "primary" },
        { crop: "Soja", percentage: 27, color: "accent" },
        { crop: "Tomate", percentage: 18, color: "secondary" },
        { crop: "Feijão", percentage: 12, color: "warning" },
        { crop: "Outros", percentage: 8, color: "info" }
      ]
    };
  }
}

export const storage = new MemStorage();
