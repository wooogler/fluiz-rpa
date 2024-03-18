import { By, WebDriver, WebElement, until } from "selenium-webdriver";

export function getFindBy(targetId: string) {
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

export async function findElement(
  driver: WebDriver,
  by: By,
  timeout: number = 10000
) {
  let context: "main" | "iframe" = "main";

  let iframe = await driver
    .findElement(By.css("body > iframe"))
    .catch((e) => null);

  if (iframe) {
    await driver.switchTo().frame(iframe);
    context = "iframe";
  }

  let element = await driver
    .wait(until.elementLocated(by), timeout)
    .catch((e) => null);
  if (!element) {
    throw new Error("element not found");
  }

  return { element, context };
}

export async function clickElement(driver: WebDriver, targetId: string) {
  const by = getFindBy(targetId);

  const { element, context } = await findElement(driver, by, 10000);
  await element.click();

  if (context === "iframe") {
    await driver.switchTo().defaultContent();
  }
}

export async function inputElement(
  driver: WebDriver,
  targetId: string,
  inputValue: string,
  dataMap: Map<string, string>
) {
  const by = getFindBy(targetId);

  const { element, context } = await findElement(driver, by, 10000);

  if (dataMap.has(inputValue)) {
    inputValue = dataMap.get(inputValue) || "";
  }
  await element.sendKeys(inputValue);

  if (context === "iframe") {
    await driver.switchTo().defaultContent();
  }
}

export async function extractInfo(
  driver: WebDriver,
  targetId: string,
  key?: string,
  dataMap?: Map<string, string>
) {
  if (!key || !dataMap) {
    throw new Error("key or dataMap is required");
  }

  const by = getFindBy(targetId);
  const { element, context } = await findElement(driver, by, 10000);
  const value = await element.getText();

  dataMap.set(key, value);

  if (context === "iframe") {
    await driver.switchTo().defaultContent();
  }
}

export async function enterPress(driver: WebDriver) {
  await driver.actions().sendKeys("\uE007").perform();
}
