import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import SuperJSON from 'superjson';
import { serializeCoeffs } from '../src/lib/serialization';

const http = httpRouter();

http.route({
  path: '/api/collections',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    const collections = await ctx.runQuery(api.collections.list);

    // Add serialized field to each collection
    const serializedCollections = collections.map((collection) => {
      const { _id, _creationTime, ...rest } = collection;
      return {
        ...rest,
        _id: _id.toString(),
        // @ts-ignore-next-line
        serialized: serializeCoeffs(rest.coeffs, rest.globals),
      };
    });

    return new Response(SuperJSON.stringify(serializedCollections), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }),
});

export default http;
