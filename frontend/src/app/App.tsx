import React from 'react';

import { Providers } from '@/app/providers';
import { AppRoutes } from '@/infrastructure/routing/routes';

export function App(): React.ReactElement {
  return (
    <Providers>
      <AppRoutes />
    </Providers>
  );
}
