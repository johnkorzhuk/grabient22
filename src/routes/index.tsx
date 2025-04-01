import { createFileRoute, useLoaderData } from '@tanstack/react-router';

import { ThemeToggle } from '~/components/theme/ThemeToggle';
import { fetchCollections } from '~/lib/fetchCollections';
import * as Sentry from '@sentry/tanstackstart-react';

function CollectionsDisplay() {
  const loaderData = useLoaderData({
    from: '/',
  });

  console.log({ loaderData });

  return (
    <div>
      <h1>Home</h1>
      <ThemeToggle />

      <pre>{JSON.stringify(loaderData, null, 2)}</pre>
    </div>
  );
}

function Home() {
  return <CollectionsDisplay />;
}

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    const data = await fetchCollections();

    return data;
  },
});
