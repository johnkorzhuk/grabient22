import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// HTTP endpoint that lists all collections (same as the list query function)
http.route({
  path: "/api/collections",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const collections = await ctx.runQuery(api.collections.list);
    return new Response(JSON.stringify(collections), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
});

export default http;
