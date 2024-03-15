import axios from "axios";
import { LinkedEvent, Task, TaskEvents, Event } from "./task.schema";
import { replayEvents } from "../rpa";

export async function getTasks() {
  const response = await axios.get<Task[]>(
    "http://125.131.73.23:8855/api/tasks"
  );
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

export async function replayTask(taskId: string) {
  const response = await axios.get<TaskEvents>(
    `http://125.131.73.23:8855/api/tasks/${taskId}`
  );
  const events = response.data.events;
  const flattenedEvents = events.flatMap((event) => flattenEvents(event));
  console.log(flattenedEvents);

  await replayEvents(flattenedEvents);

  return response.data;
}
