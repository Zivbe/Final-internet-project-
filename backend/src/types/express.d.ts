import type { File } from "multer";

declare global {
  namespace Express {
    interface Request {
      file?: File;
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

export {};
