import { By, WebDriver, until } from "selenium-webdriver";

export async function openWindow(driver: WebDriver, url: string) {
  await driver.get(url);
  await driver.wait(() =>
    driver
      .executeScript("return document.readyState")
      .then((readyState) => readyState === "complete")
  );
  await driver.sleep(1000);

  const windowHandle = await driver.getWindowHandle();
  return windowHandle;
}

export async function closeTab(driver: WebDriver, windowHandle?: string) {
  if (windowHandle) {
    await driver.switchTo().window(windowHandle);
    await driver.close();
  }
}
