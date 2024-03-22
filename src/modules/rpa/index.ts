import { Builder, By, ThenableWebDriver, WebDriver } from "selenium-webdriver";
import path from "path";
import { Event } from "../task/task.schema";
import { closeTab, openWindow } from "./windowEvents";
import {
  acceptPopup,
  clickElement,
  enterPress,
  extractInfo,
  inputElement,
  screenshotElement,
  selectOption,
} from "./actionEvents";
import { inputCert } from "./specificEvents";
import updateDataMap from "./updateDataMap";

const chromeDriverPath = path.join(
  __dirname,
  "src",
  "modules",
  "rpa",
  "chromedriver.exe"
);

process.env["webdriver.chrome.driver"] = chromeDriverPath;

export async function replayEvents(
  events: Event[],
  data: Record<string, string>,
  termTime: number = 500,
  quit: boolean = false
) {
  const windowHandlesMap = new Map<string, string>();
  const dataMap = new Map<string, string>();
  for (const [key, value] of Object.entries(data)) {
    dataMap.set(key, value);
  }

  const driver = new Builder().forBrowser("chrome").build();

  try {
    let inputValues: string[] = [];
    events.forEach((event) => {
      if (event.inputValue && event.inputValue.includes(">")) {
        inputValues.push(event.inputValue);
      }
    });
    let windowHandle: string | null = null;

    for (const event of events) {
      try {
        const key = `${event.windowId}:${event.tabId}`;
        if (event.type === "window-created") {
          windowHandle = await openWindow(driver, event.url);
          windowHandlesMap.set(key, windowHandle);
        } else if (event.type === "tab-removed") {
          await closeTab(driver, windowHandlesMap.get(key) || null);
          windowHandlesMap.delete(key);
        } else {
          const eventWindowHandle = windowHandlesMap.get(key);

          if (eventWindowHandle && windowHandle !== eventWindowHandle) {
            console.log("switching to window", eventWindowHandle);
            windowHandle = eventWindowHandle;
            await driver.switchTo().window(windowHandle);
          }

          if (event.type === "click") {
            await clickElement(driver, event.targetId);
          } else if (event.type === "input" && event.inputValue) {
            await inputElement(
              driver,
              event.targetId,
              event.inputValue,
              dataMap
            );
          } else if (event.type === "extract" && event.inputValue) {
            await extractInfo(
              driver,
              event.targetId,
              event.inputValue,
              dataMap
            );
          } else if (event.type === "enter-press") {
            await enterPress(driver);
          } else if (event.type === "input-cert") {
            await inputCert(driver, event.targetId, event.inputValue, dataMap);
          } else if (event.type === "select-option") {
            await selectOption(
              driver,
              event.targetId,
              event.inputValue,
              dataMap
            );
          } else if (event.type === "screenshot") {
            await screenshotElement(driver, event.targetId, event.inputValue);
          } else if (event.type === "accept-popup") {
            await acceptPopup(driver);
          }
        }
        await updateDataMap(dataMap, inputValues);
        await driver.sleep(termTime);
      } catch (e) {
        console.error(
          `Error processing event: ${JSON.stringify(event)}. Error: ${e}`
        );
        throw e; // Optionally re-throw the error if you want to stop execution
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    console.log(dataMap);
    if (quit) {
      await driver.quit();
    }
  }

  return dataMap;
}
