import { Redirect } from 'expo-router';

// TEMPORÁRIO (Fase 2): abre direto o catálogo de componentes. A Fase 3 troca por o Rolê.
export default function Index() {
  return <Redirect href="/catalog" />;
}
