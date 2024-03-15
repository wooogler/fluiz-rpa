import { By, WebDriver, until } from "selenium-webdriver";

function getFindBy(targetId: string) {
  if (targetId.startsWith("id=")) {
    return By.id(targetId.replace("id=", ""));
  } else if (targetId.startsWith("name=")) {
    return By.name(targetId.replace("name=", ""));
  } else if (targetId.startsWith("linkText=")) {
    return By.linkText(targetId.replace("linkText=", ""));
  } else if (targetId.startsWith("css=")) {
    return By.css(targetId.replace("css=", ""));
  } else {
    throw new Error(`Unsupported targetId format: ${targetId}`);
  }
}

async function waitForElement(
  driver: WebDriver,
  by: By,
  timeout: number = 10000
) {
  const element = await driver.wait(until.elementLocated(by), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element;
}

export async function clickElement(
  driver: WebDriver,
  targetId: string,
  windowHandle?: string
) {
  console.log(targetId, windowHandle, "clickElement");
  if (windowHandle) {
    await driver.switchTo().window(windowHandle);
  }

  const by = getFindBy(targetId);

  const element = await waitForElement(driver, by);
  await element.click();
}

export async function inputElement(
  driver: WebDriver,
  targetId: string,
  inputValue: string,
  windowHandle?: string
) {
  if (windowHandle) {
    await driver.switchTo().window(windowHandle);
  }

  const by = getFindBy(targetId);

  const element = await waitForElement(driver, by);
  await element.sendKeys(inputValue);
}
