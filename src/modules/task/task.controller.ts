import { FastifyReply, FastifyRequest } from "fastify";
import { getTask, getTasks, replayTask } from "./task.service";

export async function getTasksHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tasks = await getTasks();
    return reply.code(200).send(tasks);
  } catch (e) {
    console.log(e);
    return reply.code(500).send(e);
  }
}

export async function getTaskEventHandler(
  request: FastifyRequest<{ Params: { taskId: string } }>,
  reply: FastifyReply
) {
  try {
    const task = await getTask(request.params.taskId);
    return reply.code(200).send(task);
  } catch (e) {
    console.log(e);
    return reply.code(500).send(e);
  }
}

export async function replayTaskEventsHandler(
  request: FastifyRequest<{
    Params: { taskId: string };
    Body?: { data: Record<string, string> };
  }>,
  reply: FastifyReply
) {
  try {
    if (request.body && request.body.data) {
      const result = await replayTask(request.params.taskId, request.body.data);
      const responseObject = Object.fromEntries(result);
      return reply.code(200).send(responseObject);
    } else {
      throw new Error("data is required");
    }
  } catch (e) {
    console.log(e);
    return reply.code(500).send(e);
  }
}
