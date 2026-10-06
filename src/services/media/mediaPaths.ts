// Nomes e caminhos das fotos do usuário no aparelho (D32, docs/ARCHITECTURE.md seção 7.3). Tudo aqui
// é função pura, sem o sistema de arquivos. O caminho é previsível por carimbo:
//   <documentos>/stamps/<stampId>/photo-<N>.<extensão>
// e a lista de fotos sai do próprio diretório; nenhum caminho absoluto é guardado em lugar nenhum
// (no iOS o contêiner do app muda de endereço a cada atualização).

/** Pasta (dentro dos documentos do app) onde ficam as fotos de todos os carimbos. */
export const MEDIA_ROOT_DIRECTORY = 'stamps';

export const DEFAULT_PHOTO_EXTENSION = 'jpg';

const PHOTO_FILE_NAME = /^photo-(\d+)\.[a-z0-9]+$/i;
const STAMP_ID = /^[A-Za-z0-9-]+$/;
const EXTENSION = /\.([A-Za-z0-9]{1,5})$/;

/** O id do carimbo vira nome de pasta: só letras, dígitos e hífen, nunca `..` nem `/`. */
export function isValidStampId(stampId: string): boolean {
  return STAMP_ID.test(stampId);
}

/**
 * A extensão (sem o ponto, em minúsculas) do arquivo de origem, ignorando `?query` e `#fragmento` de
 * uma URI. Sem extensão reconhecível, `jpg`.
 */
export function getPhotoExtension(sourceUri: string): string {
  const path = sourceUri.split(/[?#]/)[0];
  const match = EXTENSION.exec(path);
  return match ? match[1].toLowerCase() : DEFAULT_PHOTO_EXTENSION;
}

export function getPhotoFileName(index: number, extension: string): string {
  return `photo-${index}.${extension}`;
}

/** O número da foto no nome do arquivo (`photo-3.jpg` → 3); `null` para qualquer outro arquivo. */
export function parsePhotoIndex(fileName: string): number | null {
  const match = PHOTO_FILE_NAME.exec(fileName);
  return match ? Number(match[1]) : null;
}

/** O número da próxima foto: o maior que já existe mais 1 (a primeira é a 1). */
export function getNextPhotoIndex(fileNames: readonly string[]): number {
  let highest = 0;
  for (const name of fileNames) {
    const index = parsePhotoIndex(name);
    if (index !== null && index > highest) highest = index;
  }
  return highest + 1;
}

/** Ordena os nomes de foto pelo número (`photo-2` antes de `photo-10`) e descarta o que não é foto. */
export function sortPhotoFileNames(fileNames: readonly string[]): string[] {
  return fileNames
    .filter((name) => parsePhotoIndex(name) !== null)
    .sort((a, b) => (parsePhotoIndex(a) ?? 0) - (parsePhotoIndex(b) ?? 0));
}
