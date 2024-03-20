import { By, WebDriver, WebElement, until } from "selenium-webdriver";
import fs from "fs";
import path from "path";

export function getFindBy(targetId: string) {
  const firstAttribute = targetId.split(";")[0];

  if (firstAttribute.startsWith("id=")) {
    return By.id(firstAttribute.replace("id=", ""));
  } else if (firstAttribute.startsWith("name=")) {
    return By.name(firstAttribute.replace("name=", ""));
  } else if (firstAttribute.startsWith("linkText=")) {
    return By.linkText(firstAttribute.replace("linkText=", ""));
  } else if (firstAttribute.startsWith("css=")) {
    return By.css(firstAttribute.replace("css=", ""));
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

  let isVisible = await element.isDisplayed();
  if (!isVisible) {
    throw new Error("element found but not visible");
  }

  return { element, context };
}

export async function findElements(
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

  let elements = await driver
    .wait(until.elementsLocated(by), timeout)
    .catch((e) => null);
  if (!elements) {
    throw new Error("elements not found");
  }

  return { elements, context };
}

export async function clickElement(driver: WebDriver, targetId: string) {
  const by = getFindBy(targetId);

  const { element, context } = await findElement(driver, by, 10000);
  await element.click();

  if (context === "iframe") {
    await driver.switchTo().defaultContent();
  }
}

export function extractBetweenSymbols(input: string): string {
  const match = input.match(/>(.*?)\(/);
  return match ? match[1] : input;
}

export async function inputElement(
  driver: WebDriver,
  targetId: string,
  inputValue: string,
  dataMap: Map<string, string>
) {
  const by = getFindBy(targetId);
  inputValue = extractBetweenSymbols(inputValue);

  const { element, context } = await findElement(driver, by, 10000);

  if (dataMap.has(inputValue)) {
    const data = dataMap.get(inputValue);
    inputValue = data as string;
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

export async function selectOption(
  driver: WebDriver,
  targetId: string,
  optionText?: string,
  dataMap?: Map<string, string>
) {
  if (optionText === undefined) {
    throw new Error("optionText is required");
  }

  optionText = extractBetweenSymbols(optionText);

  if (dataMap && dataMap.has(optionText)) {
    optionText = dataMap.get(optionText) || optionText;
  }

  const by = getFindBy(targetId);
  try {
    const { element, context } = await findElement(driver, by, 10000);
    if (await selectFromElement(element, optionText)) {
      if (context === "iframe") {
        await driver.switchTo().defaultContent();
      }
      return;
    }
  } catch (e) {
    console.log(e);
    console.log("Initial search failed, try expanding search area");
  }

  const cssSelector = targetId
    .split(";")
    .find((part) => part.startsWith("css="))
    ?.replace("css=", "");
  if (cssSelector) {
    let selectors = cssSelector.split(" > ");
    while (selectors.length > 0) {
      try {
        const currentSelector = selectors.join(" > ");
        const { elements, context } = await findElements(
          driver,
          By.css(currentSelector),
          1000
        );
        for (const element of elements) {
          if (await selectFromElement(element, optionText)) {
            if (context === "iframe") {
              await driver.switchTo().defaultContent();
            }
            return;
          }
        }
      } catch (e) {
        console.log(
          `Search failed for selector ${selectors.join(" > ")}, error: ${e}`
        );
      }
      selectors.pop();
    }
    throw new Error(
      `Option with text "${optionText}" not found in element with ${targetId}`
    );
  }
}

async function selectFromElement(element: WebElement, optionText: string) {
  const options = await element.findElements(By.css("option"));
  for (const option of options) {
    const text = await option.getText();
    if (text === optionText) {
      await option.click();
      return true;
    }
  }
  return false;
}

export async function screenshotElement(
  driver: WebDriver,
  targetId: string,
  fileName?: string
) {
  const by = getFindBy(targetId);
  const { element, context } = await findElement(driver, by, 10000);
  const screenshot = await element.takeScreenshot(true);
  const filePath = path.join(
    __dirname,
    "file",
    `${fileName}.png` || "no_name.png"
  );
  fs.writeFileSync(filePath, screenshot, "base64");
  console.log(`screenshot saved: ${filePath}`);
  if (context === "iframe") {
    await driver.switchTo().defaultContent();
  }
}
