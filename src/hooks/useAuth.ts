import { useContext } from 'react';

import { AuthContext, type AuthState } from '@/providers/AuthProvider';

/** Estado da sessão anônima: `status` (`signingIn` | `ready` | `error`) e `userId`. */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
