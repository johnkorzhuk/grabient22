import { createServerFn } from '@tanstack/react-start';
import type { Doc } from '../../convex/_generated/dataModel';

export type AppCollection = Omit<Doc<'collections'>, '_id' | '_creationTime'> & {
  _id: string;
};

// Create a server function without static prerendering
export const fetchCollections = createServerFn({
  // Set to undefined to run as a regular server function. TODO: figure why making this static doesnt build
  //   type: import.meta.env.PROD ? 'static' : undefined,
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

    const convexData: Doc<'collections'>[] = await response.json();

    const serializableData: AppCollection[] = convexData.map((doc) => {
      const { _id, _creationTime, ...rest } = doc;
      return {
        _id: _id.toString(),
        ...rest,
      };
    });

    return serializableData;
  } catch (error) {
    console.error('Error inside fetchCollections handler:', error);
    throw error;
  }
});
