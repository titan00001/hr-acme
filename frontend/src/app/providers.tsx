import React from 'react';
import { Provider } from 'react-redux';

import { store } from '@/infrastructure/store/store';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps): React.ReactElement {
  return <Provider store={store}>{children}</Provider>;
}
