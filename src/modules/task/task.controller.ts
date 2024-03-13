import { FastifyReply, FastifyRequest } from "fastify";
import { getTasks, replayTask } from "./task.service";

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

export async function replayTaskEventsHandler(
  request: FastifyRequest<{ Params: { taskId: string } }>,
  reply: FastifyReply
) {
  try {
    await replayTask(request.params.taskId);
  } catch (e) {
    console.log(e);
    return reply.code(500).send(e);
  }
}
