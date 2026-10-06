// Apoio dos testes que comparam tipos de domínio com `database.ts`: se os dois lados divergirem,
// o `tsc` quebra (o `proof` precisa ser `true`, mas o tipo vira `false`).

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** `snake_case` → `camelCase` no nível do tipo (`price_tier` → `priceTier`). */
export type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S;

/** Os nomes das colunas de uma linha do banco, em `camelCase`. */
export type CamelKeys<Row> = CamelCase<Extract<keyof Row, string>>;

/** Devolve o próprio `proof`; só compila com `true`, ou seja, quando `A` e `B` são o mesmo tipo. */
export function isTypeEqual<A, B>(proof: Equal<A, B>): boolean {
  return proof;
}
