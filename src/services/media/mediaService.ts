// Contrato das fotos do usuário (D32, docs/ARCHITECTURE.md seções 7.3 e 8.9). Ficam **só no
// aparelho** no MVP: nada sobe para o servidor. Cada foto pertence a um carimbo, e a lista sai do
// diretório do carimbo, sem store. Quem usa recebe esta interface e nunca o `expo-file-system`.
// Falhas do armazenamento saem como `AppError` (`unknown`).
export interface MediaService {
  /**
   * Copia a foto de `sourceUri` (por exemplo, o arquivo temporário do seletor de imagens) para o
   * armazenamento do app, ligada ao carimbo, e devolve a URI da cópia. O original não é tocado.
   * Várias fotos por carimbo: cada uma ganha o próximo número.
   */
  savePhoto(stampId: string, sourceUri: string): Promise<string>;

  /** As URIs das fotos do carimbo, na ordem em que foram salvas. Sem fotos, lista vazia. */
  listPhotos(stampId: string): Promise<string[]>;

  /** Apaga as fotos do carimbo. Sem fotos, não faz nada. */
  deletePhotos(stampId: string): Promise<void>;

  /** Apaga as fotos de todos os carimbos ("Apagar meus dados"). */
  deleteAll(): Promise<void>;
}
