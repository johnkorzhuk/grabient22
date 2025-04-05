import { createServerFn } from '@tanstack/react-start';
import type { AppCollection } from '~/types';
import SuperJSON from 'superjson';

// Create a server function without static prerendering
export const fetchCollections = createServerFn({
  method: 'GET',
  response: 'data',
}).handler(async () => {
  const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL;

  if (!CONVEX_SITE_URL) {
    throw new Error('VITE_CONVEX_SITE_URL environment variable is not defined');
  }

  try {
    const response = await fetch(`${CONVEX_SITE_URL}/api/collections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch collections: ${response.status}`, errorText);
      throw new Error(`Failed to fetch collections: ${response.status}`);
    }

    const text = await response.text();
    return SuperJSON.parse(text) as AppCollection[];
  } catch (error) {
    console.error('Error inside fetchCollections handler:', error);
    throw error;
  }
});
