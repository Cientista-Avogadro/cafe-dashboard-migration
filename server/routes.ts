import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertFarmSchema, insertSectorSchema, insertLotSchema, insertCropSchema, 
  insertInputSchema, insertIrrigationSchema, insertPestSchema, 
  insertTransactionSchema, insertActivitySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Dashboard data route
  app.get("/api/dashboard", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user?.id;
      if (!userId) return res.status(400).json({ message: "ID de usuário inválido" });
      
      const dashboardData = await storage.getDashboardData(userId);
      res.json(dashboardData);
    } catch (error) {
      next(error);
    }
  });

  // Farm routes
  app.get("/api/farms", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user?.id;
      const farms = await storage.getFarms(userId);
      res.json(farms);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/farms/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const farmId = parseInt(req.params.id);
      const farm = await storage.getFarm(farmId);
      
      if (!farm) {
        return res.status(404).json({ message: "Fazenda não encontrada" });
      }
      
      res.json(farm);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/farms", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user?.id;
      if (!userId) return res.status(400).json({ message: "ID de usuário inválido" });
      
      try {
        const validatedData = insertFarmSchema.parse({
          ...req.body,
          user_id: userId
        });
        
        const farm = await storage.createFarm(validatedData);
        res.status(201).json(farm);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/farms/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const farmId = parseInt(req.params.id);
      const farm = await storage.getFarm(farmId);
      
      if (!farm) {
        return res.status(404).json({ message: "Fazenda não encontrada" });
      }
      
      try {
        const validatedData = insertFarmSchema.partial().parse(req.body);
        const updatedFarm = await storage.updateFarm(farmId, validatedData);
        res.json(updatedFarm);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/farms/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const farmId = parseInt(req.params.id);
      const farm = await storage.getFarm(farmId);
      
      if (!farm) {
        return res.status(404).json({ message: "Fazenda não encontrada" });
      }
      
      const success = await storage.deleteFarm(farmId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Falha ao excluir fazenda" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Sector routes
  app.get("/api/sectors", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const farmId = req.query.farmId ? parseInt(req.query.farmId as string) : undefined;
      const sectors = await storage.getSectors(farmId);
      res.json(sectors);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sectors/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const sectorId = parseInt(req.params.id);
      const sector = await storage.getSector(sectorId);
      
      if (!sector) {
        return res.status(404).json({ message: "Setor não encontrado" });
      }
      
      res.json(sector);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sectors", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      try {
        const validatedData = insertSectorSchema.parse(req.body);
        const sector = await storage.createSector(validatedData);
        res.status(201).json(sector);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/sectors/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const sectorId = parseInt(req.params.id);
      const sector = await storage.getSector(sectorId);
      
      if (!sector) {
        return res.status(404).json({ message: "Setor não encontrado" });
      }
      
      try {
        const validatedData = insertSectorSchema.partial().parse(req.body);
        const updatedSector = await storage.updateSector(sectorId, validatedData);
        res.json(updatedSector);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/sectors/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const sectorId = parseInt(req.params.id);
      const sector = await storage.getSector(sectorId);
      
      if (!sector) {
        return res.status(404).json({ message: "Setor não encontrado" });
      }
      
      const success = await storage.deleteSector(sectorId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Falha ao excluir setor" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Lot routes
  app.get("/api/lots", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const sectorId = req.query.sectorId ? parseInt(req.query.sectorId as string) : undefined;
      const lots = await storage.getLots(sectorId);
      res.json(lots);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/lots/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const lotId = parseInt(req.params.id);
      const lot = await storage.getLot(lotId);
      
      if (!lot) {
        return res.status(404).json({ message: "Lote não encontrado" });
      }
      
      res.json(lot);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/lots", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      try {
        const validatedData = insertLotSchema.parse(req.body);
        const lot = await storage.createLot(validatedData);
        res.status(201).json(lot);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/lots/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const lotId = parseInt(req.params.id);
      const lot = await storage.getLot(lotId);
      
      if (!lot) {
        return res.status(404).json({ message: "Lote não encontrado" });
      }
      
      try {
        const validatedData = insertLotSchema.partial().parse(req.body);
        const updatedLot = await storage.updateLot(lotId, validatedData);
        res.json(updatedLot);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/lots/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const lotId = parseInt(req.params.id);
      const lot = await storage.getLot(lotId);
      
      if (!lot) {
        return res.status(404).json({ message: "Lote não encontrado" });
      }
      
      const success = await storage.deleteLot(lotId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Falha ao excluir lote" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Crop routes
  app.get("/api/crops", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const crops = await storage.getCrops();
      res.json(crops);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/crops/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const cropId = parseInt(req.params.id);
      const crop = await storage.getCrop(cropId);
      
      if (!crop) {
        return res.status(404).json({ message: "Cultura não encontrada" });
      }
      
      res.json(crop);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/crops", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      try {
        const validatedData = insertCropSchema.parse(req.body);
        const crop = await storage.createCrop(validatedData);
        res.status(201).json(crop);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/crops/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const cropId = parseInt(req.params.id);
      const crop = await storage.getCrop(cropId);
      
      if (!crop) {
        return res.status(404).json({ message: "Cultura não encontrada" });
      }
      
      try {
        const validatedData = insertCropSchema.partial().parse(req.body);
        const updatedCrop = await storage.updateCrop(cropId, validatedData);
        res.json(updatedCrop);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/crops/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const cropId = parseInt(req.params.id);
      const crop = await storage.getCrop(cropId);
      
      if (!crop) {
        return res.status(404).json({ message: "Cultura não encontrada" });
      }
      
      const success = await storage.deleteCrop(cropId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Falha ao excluir cultura" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Input routes
  app.get("/api/inputs", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const inputs = await storage.getInputs();
      res.json(inputs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/inputs/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const inputId = parseInt(req.params.id);
      const input = await storage.getInput(inputId);
      
      if (!input) {
        return res.status(404).json({ message: "Insumo não encontrado" });
      }
      
      res.json(input);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/inputs", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      try {
        const validatedData = insertInputSchema.parse(req.body);
        const input = await storage.createInput(validatedData);
        res.status(201).json(input);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/inputs/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const inputId = parseInt(req.params.id);
      const input = await storage.getInput(inputId);
      
      if (!input) {
        return res.status(404).json({ message: "Insumo não encontrado" });
      }
      
      try {
        const validatedData = insertInputSchema.partial().parse(req.body);
        const updatedInput = await storage.updateInput(inputId, validatedData);
        res.json(updatedInput);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/inputs/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const inputId = parseInt(req.params.id);
      const input = await storage.getInput(inputId);
      
      if (!input) {
        return res.status(404).json({ message: "Insumo não encontrado" });
      }
      
      const success = await storage.deleteInput(inputId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Falha ao excluir insumo" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Irrigation routes
  app.get("/api/irrigations", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const farmId = req.query.farmId ? parseInt(req.query.farmId as string) : undefined;
      const irrigations = await storage.getIrrigations(farmId);
      res.json(irrigations);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/irrigations/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const irrigationId = parseInt(req.params.id);
      const irrigation = await storage.getIrrigation(irrigationId);
      
      if (!irrigation) {
        return res.status(404).json({ message: "Registro de irrigação não encontrado" });
      }
      
      res.json(irrigation);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/irrigations", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      try {
        const validatedData = insertIrrigationSchema.parse(req.body);
        const irrigation = await storage.createIrrigation(validatedData);
        res.status(201).json(irrigation);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/irrigations/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const irrigationId = parseInt(req.params.id);
      const irrigation = await storage.getIrrigation(irrigationId);
      
      if (!irrigation) {
        return res.status(404).json({ message: "Registro de irrigação não encontrado" });
      }
      
      try {
        const validatedData = insertIrrigationSchema.partial().parse(req.body);
        const updatedIrrigation = await storage.updateIrrigation(irrigationId, validatedData);
        res.json(updatedIrrigation);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/irrigations/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const irrigationId = parseInt(req.params.id);
      const irrigation = await storage.getIrrigation(irrigationId);
      
      if (!irrigation) {
        return res.status(404).json({ message: "Registro de irrigação não encontrado" });
      }
      
      const success = await storage.deleteIrrigation(irrigationId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Falha ao excluir registro de irrigação" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Pest routes
  app.get("/api/pests", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const farmId = req.query.farmId ? parseInt(req.query.farmId as string) : undefined;
      const pests = await storage.getPests(farmId);
      res.json(pests);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/pests/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const pestId = parseInt(req.params.id);
      const pest = await storage.getPest(pestId);
      
      if (!pest) {
        return res.status(404).json({ message: "Registro de praga não encontrado" });
      }
      
      res.json(pest);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/pests", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      try {
        const validatedData = insertPestSchema.parse(req.body);
        const pest = await storage.createPest(validatedData);
        res.status(201).json(pest);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/pests/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const pestId = parseInt(req.params.id);
      const pest = await storage.getPest(pestId);
      
      if (!pest) {
        return res.status(404).json({ message: "Registro de praga não encontrado" });
      }
      
      try {
        const validatedData = insertPestSchema.partial().parse(req.body);
        const updatedPest = await storage.updatePest(pestId, validatedData);
        res.json(updatedPest);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/pests/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const pestId = parseInt(req.params.id);
      const pest = await storage.getPest(pestId);
      
      if (!pest) {
        return res.status(404).json({ message: "Registro de praga não encontrado" });
      }
      
      const success = await storage.deletePest(pestId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Falha ao excluir registro de praga" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const farmId = req.query.farmId ? parseInt(req.query.farmId as string) : undefined;
      const transactions = await storage.getTransactions(farmId);
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/transactions/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/transactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      try {
        const validatedData = insertTransactionSchema.parse(req.body);
        const transaction = await storage.createTransaction(validatedData);
        res.status(201).json(transaction);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/transactions/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      
      try {
        const validatedData = insertTransactionSchema.partial().parse(req.body);
        const updatedTransaction = await storage.updateTransaction(transactionId, validatedData);
        res.json(updatedTransaction);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/transactions/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      
      const success = await storage.deleteTransaction(transactionId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Falha ao excluir transação" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const farmId = req.query.farmId ? parseInt(req.query.farmId as string) : undefined;
      const activities = await storage.getActivities(farmId);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/activities/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const activityId = parseInt(req.params.id);
      const activity = await storage.getActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      res.json(activity);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/activities", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      try {
        const validatedData = insertActivitySchema.parse(req.body);
        const activity = await storage.createActivity(validatedData);
        res.status(201).json(activity);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/activities/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const activityId = parseInt(req.params.id);
      const activity = await storage.getActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      try {
        const validatedData = insertActivitySchema.partial().parse(req.body);
        const updatedActivity = await storage.updateActivity(activityId, validatedData);
        res.json(updatedActivity);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/activities/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const activityId = parseInt(req.params.id);
      const activity = await storage.getActivity(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: "Atividade não encontrada" });
      }
      
      const success = await storage.deleteActivity(activityId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Falha ao excluir atividade" });
      }
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
