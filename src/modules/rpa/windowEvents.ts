import { Builder, By, WebDriver, until } from "selenium-webdriver";

export async function openWindow(driver: WebDriver, url: string) {
  console.log("opening new window");

  await driver.switchTo().newWindow("tab");
  await driver.get(url);
  console.log("openWindow: get", url);

  await driver.wait(async () => {
    const readyState = await driver.executeScript("return document.readyState");
    return readyState === "complete";
  }, 10000);

  const allWindowHandles = await driver.getAllWindowHandles();

  let targetWindowHandle = null;
  for (const windowHandle of allWindowHandles) {
    await driver.switchTo().window(windowHandle);
    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl === url) {
      targetWindowHandle = windowHandle;
      console.log("openWindow: found window", windowHandle);
      break;
    }
  }

  return targetWindowHandle || "";
}

export async function closeTab(driver: WebDriver, windowHandle: string | null) {
  if (windowHandle) {
    await driver.switchTo().window(windowHandle);
    await driver.close();

    const windows = await driver.getAllWindowHandles();
    if (windows.length > 0) {
      // 다른 탭이 열려있다면, 첫 번째 탭으로 전환
      await driver.switchTo().window(windows[0]);
    } else {
      // 열려있는 다른 탭이 없다면, 새 창을 열어서 작업을 계속할 수 있도록 합니다.
      await driver.switchTo().newWindow("tab");
      await driver.get("about:blank");
    }
  }
}
