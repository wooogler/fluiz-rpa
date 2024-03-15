import { By, WebDriver, until } from "selenium-webdriver";

export async function openWindow(driver: WebDriver, url: string) {
  await driver.get(url);
  await driver.wait(() =>
    driver
      .executeScript("return document.readyState")
      .then((readyState) => readyState === "complete")
  );

  await driver.wait(until.elementLocated(By.css("iframe")), 10000); // 10초 대기

  let iframes = await driver.findElements(By.css("iframe"));
  console.log("Number of iframes found:", iframes.length);

  if (iframes.length > 0) {
    const bodyChildIframe = await driver.findElements(By.css("body > iframe"));
    if (bodyChildIframe.length > 0) {
      await driver.switchTo().frame(bodyChildIframe[0]);
      console.log("Switched to the iframe directly under body");
    }
  }

  const windowHandle = await driver.getWindowHandle();
  console.log(windowHandle, "openWindow");
  return windowHandle;
}
