// API pública do assunto "media" (docs/ARCHITECTURE.md, seção 8.9): as fotos do usuário, só no
// aparelho (D32).
import { FileSystemMediaService } from './fileSystemMediaService';

export type { MediaService } from './mediaService';

export const mediaService = new FileSystemMediaService();
