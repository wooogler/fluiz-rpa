import axios from "axios";
import { LinkedEvent, Task, TaskEvents, Event } from "./task.schema";
import { replayEvents } from "../rpa";

export async function getTasks() {
  const response = await axios.get<Task[]>(
    "http://125.131.73.23:8855/api/tasks"
  );
  return response.data;
}

export async function getTask(taskId: string) {
  const response = await axios.get<TaskEvents>(
    `https://api.fluiz.io/api/tasks/${taskId}`
  );
  const events = response.data.events;
  const flattenedEvents = events.flatMap((event) => flattenEvents(event));
  console.log(flattenedEvents);
  return response.data;
}

const flattenEvents = (
  event: LinkedEvent | undefined,
  events: Event[] = []
): Event[] => {
  if (!event) return events;
  const { nextEvent, ...currentEvent } = event;
  events.push(currentEvent);

  if (nextEvent) {
    return flattenEvents(nextEvent, events);
  }

  return events;
};

export async function replayTask(taskId: string, data: Record<string, string>) {
  const response = await axios.get<TaskEvents>(
    `https://api.fluiz.io/api/tasks/${taskId}`
  );
  const events = response.data.events;
  const flattenedEvents = events.flatMap((event) => flattenEvents(event));
  console.log(flattenedEvents);

  const result = await replayEvents(flattenedEvents, data);

  return result;
}
