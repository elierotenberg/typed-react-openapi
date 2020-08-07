import { promisify } from "util";

import fastify from "fastify";
import cors from "fastify-cors";
import jwt from "jsonwebtoken";

const sign = promisify(jwt.sign);
const verify = promisify(jwt.verify);

import type { Item } from "../build";

const items: Item[] = [
  {
    id: "a",
    title: "item A",
    description: "description for item A",
    done: true,
  },
  {
    id: "b",
    title: "item B",
    description: "description for item B",
    done: false,
  },
  {
    id: "c",
    title: "item B",
    description: "description for item C",
    done: false,
  },
];

const server = fastify({
  logger: {
    level: "trace",
  },
});

server.register(cors, { origin: ["http://localhost:8000"] });

const jwtSecret = "obviously not a secret";

server.post("/auth", async (_request, reply) => {
  const token = await sign(
    {
      name: "obviously a non-unique username",
    },
    jwtSecret,
  );
  return reply.send(token);
});

server.register(async (server) => {
  server.addHook("onRequest", async (request) => {
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new Error("no authorization");
    }
    await verify(authorization.slice("Bearer ".length), jwtSecret);
  });

  server.get("/item", async () => items);
  server.put("/item/:id", async (request, reply) => {
    const { id } = request.params as Record<string, string>;
    const item = items.find((item) => item.id === id);
    if (!item) {
      throw new Error("item not found");
    }
    // no validation for tests purposes
    Object.assign(item, request.body);
    return reply.send(item);
  });
});

server.listen(8080, "0.0.0.0", (error, address) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`listening at ${address}`);
});
