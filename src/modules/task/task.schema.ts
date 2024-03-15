import { z } from "zod";
import { buildJsonSchemas } from "fastify-zod";

const taskSchema = z.object({
  taskId: z.string(),
  taskName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const getTasksResponseSchema = z.array(taskSchema);

export type Task = z.infer<typeof taskSchema>;

const eventSchema = z.object({
  uid: z.string(),
  type: z.union([
    z.literal("click"),
    z.literal("input"),
    z.literal("navigation-url"),
    z.literal("navigation-back-forward"),
    z.literal("tab-created"),
    z.literal("window-created"),
    z.literal("tab-removed"),
    z.literal("window-removed"),
    z.literal("input-cert"),
  ]),
  targetId: z.string(),
  url: z.string(),
  tabId: z.number(),
  windowId: z.number(),
  inputValue: z.string().optional(),
});

export type Event = z.infer<typeof eventSchema>;

export type LinkedEvent = Event & {
  nextEvent?: LinkedEvent;
};

const linkedEventSchema: z.ZodType<LinkedEvent> = eventSchema.extend({
  nextEvent: z.lazy(() => linkedEventSchema).optional(),
});

const taskEventsSchema = taskSchema.extend({
  events: z.array(linkedEventSchema),
});

export type TaskEvents = z.infer<typeof taskEventsSchema>;

export const { schemas: taskSchemas, $ref } = buildJsonSchemas({
  taskSchema,
  getTasksResponseSchema,
  taskEventsSchema,
});
