// backend/src/types/express.d.ts
import 'express';

declare module 'express' {
  export interface Request {
    userId?: number; // Añade la propiedad userId
  }
}
/*declare global {
  namespace Express {
  interface Request {      
      userId?: number; // Añade la propiedad userId
    } 
  }
}*/
