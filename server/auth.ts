import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";
import * as hasuraService from "./hasura";

// Define a interface do usuário para Express de acordo com a definição em schema.ts
type ExpressUserType = {
  id: number;
  username: string;
  password?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  created_at?: Date | string | null;
  [key: string]: any;
};

declare global {
  namespace Express {
    // Use uma interface diferente para evitar referência circular
    interface User extends ExpressUserType {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "agrogestao-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Estratégia de autenticação local usando Hasura
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Tenta primeiro com o Hasura e se falhar, usa o armazenamento local
        const hasuraUser = await hasuraService.getUserByUsername(username);
        
        if (hasuraUser && (await comparePasswords(password, hasuraUser.password))) {
          return done(null, hasuraUser);
        }
        
        // Se não encontrou no Hasura ou a senha é inválida, tenta no armazenamento local
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        
        // Em caso de erro com o Hasura, tenta no armazenamento local
        try {
          const user = await storage.getUserByUsername(username);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (storageError) {
          return done(storageError);
        }
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Tenta primeiro com o Hasura
      const hasuraUser = await hasuraService.getUserById(id);
      if (hasuraUser) {
        return done(null, hasuraUser);
      }
      
      // Se não encontrar no Hasura, tenta no armazenamento local
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      console.error("Erro ao deserializar usuário:", error);
      
      // Em caso de erro com o Hasura, tenta no armazenamento local
      try {
        const user = await storage.getUser(id);
        done(null, user);
      } catch (storageError) {
        done(storageError);
      }
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Verifica se já existe no Hasura
      const hasuraExistingUser = await hasuraService.getUserByUsername(req.body.username);
      if (hasuraExistingUser) {
        return res.status(400).send("Nome de usuário já existe");
      }
      
      // Verifica se já existe no armazenamento local
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Nome de usuário já existe");
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      try {
        // Tenta criar no Hasura primeiro
        const hasuraUser = await hasuraService.createUser(req.body.username, hashedPassword);
        req.login(hasuraUser, (err) => {
          if (err) return next(err);
          res.status(201).json(hasuraUser);
        });
      } catch (hasuraError) {
        console.error("Erro ao criar usuário no Hasura, tentando armazenamento local:", hasuraError);
        
        // Se falhar no Hasura, tenta o armazenamento local
        const user = await storage.createUser({
          ...req.body,
          password: hashedPassword,
        });

        req.login(user, (err) => {
          if (err) return next(err);
          res.status(201).json(user);
        });
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
