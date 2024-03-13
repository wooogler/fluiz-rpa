import fastify from "fastify";
import taskRoutes from "./modules/task/task.route";
import { taskSchemas } from "./modules/task/task.schema";

const server = fastify({ logger: true });

async function main() {
  for (const schema of taskSchemas) {
    server.addSchema(schema);
  }

  server.register(taskRoutes, { prefix: "/api/tasks" });

  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });

    console.log(`Server listening`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
