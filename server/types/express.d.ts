declare global {
  namespace Express {
    interface Request {
      authUserId?: string;
      treinadoraId?: string;
    }
  }
}

export {};
