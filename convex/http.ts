import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import SuperJSON from 'superjson';
import LZString from 'lz-string';
import { gradientCoeffsSchema, numberTuple4Schema } from './schema';
import { z } from 'zod';

// Local implementation of serializeCoeffs using Zod instead of Valibot
function serializeCoeffs(
  coeffs: z.infer<typeof gradientCoeffsSchema>,
  globals: z.infer<typeof numberTuple4Schema>,
): string {
  // Validate coeffs using Zod schema
  const result = gradientCoeffsSchema.parse(coeffs);

  // Format to 4 decimals and combine coeffs (dropping alpha) and globals
  const format = (n: number) => Number(n.toFixed(4));
  const data = [...result.map((vec) => [vec[0], vec[1], vec[2]]).flat(), ...globals];

  // Convert to string and compress
  const compressed = data.map(format).join(',');
  return LZString.compressToEncodedURIComponent(compressed);
}

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
