import { FastifyInstance } from "fastify";
import {
  getTaskEventHandler,
  getTasksHandler,
  replayTaskEventsHandler,
} from "./task.controller";
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
    getTaskEventHandler
  );

  server.post(
    "/:taskId",
    {
      schema: {
        params: { taskId: { type: "string" } },
      },
    },
    replayTaskEventsHandler
  );
}

export default taskRoutes;
