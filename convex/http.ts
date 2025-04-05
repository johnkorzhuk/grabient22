import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import { gradientCoeffsSchema } from './schema';
import type { Doc } from './_generated/dataModel';
import LZString from 'lz-string';
import SuperJSON from 'superjson';
import { serializeCoeffs } from '../src/lib/serialization';

const http = httpRouter();

// HTTP endpoint that lists all collections (same as the list query function)
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
        serialized: serializeCoeffs(rest.coeffs, rest.globals as [number, number, number, number]),
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
