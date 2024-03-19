import { By, WebDriver, WebElement, until } from "selenium-webdriver";
import fs from "fs";
import path from "path";

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

  let isVisible = await element.isDisplayed();
  if (!isVisible) {
    throw new Error("element found but not visible");
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

export async function selectOption(
  driver: WebDriver,
  targetId: string,
  optionText?: string
) {
  if (optionText === undefined) {
    throw new Error("optionText is required");
  }
  const by = getFindBy(targetId);
  const { element, context } = await findElement(driver, by, 10000);
  await driver.wait(
    async () => {
      const options = await element.findElements(By.css("option"));
      for (const option of options) {
        const text = await option.getText();
        if (text === optionText) {
          await option.click();
          return true;
        }
      }
      return false;
    },
    1000,
    `Option with text "${optionText}" not found in element with ${targetId}`
  );

  const optionToClick = await element.findElement(
    By.xpath(`.//option[normalize-space(.) = ${JSON.stringify(optionText)}]`)
  );
  await optionToClick.click();

  if (context === "iframe") {
    await driver.switchTo().defaultContent();
  }
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
