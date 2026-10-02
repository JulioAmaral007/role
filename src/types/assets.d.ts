// Fontes importadas direto do pacote (o Metro as trata como asset e devolve o id do recurso).
declare module '*.ttf' {
  const source: number;
  export default source;
}
