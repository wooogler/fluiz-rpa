import axios from "axios";
import { Event, Task, TaskEvents } from "./task.schema";

export async function getTasks() {
  const response = await axios.get<Task[]>(
    "http://125.131.73.23:8855/api/tasks"
  );
  return response.data;
}

const flattenEvents = (event: Event, events: Event[] = []) => {
  events.push(event);
  if (event.nextEvent) {
    flattenEvents(event.nextEvent, events);
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
  return response.data;
}
