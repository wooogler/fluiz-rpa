import { FastifyInstance } from "fastify";
import { getTasksHandler, replayTaskEventsHandler } from "./task.controller";
import { $ref } from "./task.schema";

async function taskRoutes(server: FastifyInstance) {
  server.get(
    "/",
    {
      schema: {
        response: {
          200: $ref("getTasksResponseSchema"),
        },
      },
    },
    getTasksHandler
  );

  server.get(
    "/:taskId",
    {
      schema: {
        params: { taskId: { type: "string" } },
        response: { 200: $ref("taskEventsSchema") },
      },
    },
    replayTaskEventsHandler
  );
}

export default taskRoutes;
