import { Builder, By, ThenableWebDriver, WebDriver } from "selenium-webdriver";
import path from "path";
import { Event } from "../task/task.schema";
import { openWindow } from "./windowEvents";
import { clickElement, inputElement } from "./actionEvents";

const chromeDriverPath = path.join(
  __dirname,
  "src",
  "modules",
  "rpa",
  "chromedriver.exe"
);

process.env["webdriver.chrome.driver"] = chromeDriverPath;

function getDriver(): WebDriver {
  return new Builder().forBrowser("chrome").build();
}

export async function replayEvents(events: Event[]) {
  const driver = getDriver();
  let windowHandle: string | undefined = undefined;
  try {
    for (const event of events) {
      if (event.type === "window-created") {
        windowHandle = await openWindow(driver, event.url);
      } else if (event.type === "click") {
        await clickElement(driver, event.targetId, windowHandle);
      } else if (event.type === "input" && event.inputValue) {
        await inputElement(
          driver,
          event.targetId,
          event.inputValue,
          windowHandle
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
}
