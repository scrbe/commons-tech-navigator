'use client';

// ThemeRegistry implements the MUI + Next.js App Router emotion cache pattern.
// Required because MUI uses emotion for CSS-in-JS, which needs server-side style
// injection to prevent a flash of unstyled content (FOUC) on initial render.
// Reference: https://mui.com/material-ui/integrations/nextjs/

import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { useState } from 'react';

function createEmotionCache() {
  let insertedNames: string[] = [];

  const cache = createCache({ key: 'mui' });
  cache.compat = true;

  const prevInsert = cache.insert;
  cache.insert = (...args) => {
    const serialized = args[1];
    if (cache.inserted[serialized.name] === undefined) {
      insertedNames.push(serialized.name);
    }
    return prevInsert(...args);
  };

  const flush = () => {
    const names = insertedNames;
    insertedNames = [];
    return names;
  };

  return { cache, flush };
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(createEmotionCache);

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;

    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline normalises browser defaults while respecting the MUI theme */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
