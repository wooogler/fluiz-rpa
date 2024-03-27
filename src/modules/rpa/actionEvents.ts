import { By, WebDriver, WebElement, until } from "selenium-webdriver";
import fs from "fs";
import path from "path";

export async function switchToIframeIfNeeded(
  driver: WebDriver,
  targetId: string,
  timeout: number = 10000
) {
  const iframeIdentifiers = targetId.match(
    /\[id=(.*?)\]|\[name=(.*?)\]|\[src=(.*?)\]/g
  );
  if (iframeIdentifiers) {
    const currentPageUrl = await driver.getCurrentUrl();
    const baseUrl = new URL(currentPageUrl);

    for (const identifier of iframeIdentifiers) {
      const match = identifier.match(
        /\[id=(.*?)\]|\[name=(.*?)\]|\[src=(.*?)\]/
      );
      const iframeId = match ? match[1] : null;
      const iframeName = match ? match[2] : null;
      let iframeSrc = match ? match[3] : null;

      if (iframeSrc) {
        const srcUrl = new URL(iframeSrc, baseUrl.href);
        if (srcUrl.origin === baseUrl.origin) {
          iframeSrc = srcUrl.pathname + srcUrl.search + srcUrl.hash;
        }
      }

      let iframe;

      if (iframeId) {
        iframe = await driver.wait(
          until.elementLocated(By.id(iframeId)),
          timeout
        );
      } else if (iframeName) {
        iframe = await driver.wait(
          until.elementLocated(By.name(iframeName)),
          timeout
        );
      } else if (iframeSrc) {
        iframe = await driver.wait(
          until.elementLocated(By.css(`iframe[src="${iframeSrc}"]`)),
          timeout
        );
      }

      if (iframe) {
        await driver.switchTo().frame(iframe);
      } else {
        return false;
      }
    }
    return true;
  }

  return false;
}

function trimIframeIdentifiers(targetId: string) {
  return targetId.replace(/\[.*?\]/g, "").trim();
}

export function getFindBy(targetId: string) {
  const elementTargetId = trimIframeIdentifiers(targetId);
  const firstAttribute = elementTargetId.split(";")[0];

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
  targetId: string,
  timeout: number = 10000
) {
  const by = getFindBy(targetId);

  let element = await driver
    .wait(until.elementLocated(by), timeout)
    .catch((e) => null);
  if (!element) {
    throw new Error(`element not found with targetId: ${targetId}`);
  }

  let isVisible = await element.isDisplayed();
  if (!isVisible) {
    throw new Error(`element found but not visible: ${targetId}`);
  }

  const tempId = new Date().getTime().toString();
  await driver.executeScript(
    `const setTempId = (el, id) => {
      el.setAttribute('data-temp-id', id);
      Array.from(el.querySelectorAll('*')).forEach(child => child.setAttribute('data-temp-id', id));
    };
    setTempId(arguments[0], '${tempId}');`,
    element
  );

  let isOverlayPresent = true;
  let startTime = new Date().getTime();
  while (isOverlayPresent) {
    let elapsedTime = new Date().getTime() - startTime;
    if (elapsedTime > timeout) {
      throw new Error(
        "Timeout exceeded while waiting for overlays to disappear"
      );
    }

    const rect = await element.getRect();
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    const isCorrectElement = await driver.executeScript(`
      const el = document.elementFromPoint(${centerX}, ${centerY});
      return el && el.getAttribute('data-temp-id') === '${tempId}';
      `);

    if (isCorrectElement) {
      isOverlayPresent = false;
    } else {
      await driver.sleep(100);
    }
  }

  await driver.executeScript(
    `const clearTempId = el => {
      el.removeAttribute('data-temp-id');
      Array.from(el.querySelectorAll('*')).forEach(child => child.removeAttribute('data-temp-id'));
    };
    clearTempId(arguments[0]);`,
    element
  );

  return element;
}

export async function findElements(
  driver: WebDriver,
  targetId: string,
  timeout: number = 10000
) {
  const by = getFindBy(targetId);

  let elements = await driver
    .wait(until.elementsLocated(by), timeout)
    .catch((e) => []);
  if (!elements || elements.length === 0) {
    throw new Error("elements not found");
  }

  return elements;
}

export async function clickElement(driver: WebDriver, targetId: string) {
  const switchedToIframe = await switchToIframeIfNeeded(driver, targetId);

  try {
    const element = await findElement(driver, targetId, 1000);
    await element.click();
    try {
      const alert = await driver.switchTo().alert();
      await alert.accept();
    } catch (alertError) {}
  } catch (e) {
    console.log(`Initial search failed, try expanding search area: ${e}`);

    const cssSelector = trimIframeIdentifiers(targetId)
      .split(";")
      .find((part) => part.startsWith("css="))
      ?.replace("css=", "");

    if (cssSelector) {
      let selectors = cssSelector.split(" > ");
      while (selectors.length > 0) {
        try {
          const currentSelector = selectors.join(" > ");
          const elements = await findElements(
            driver,
            `css=${currentSelector}`,
            100
          );
          for (const element of elements) {
            if (await clickInElement(driver, element, targetId)) {
              console.log("search success");
              if (switchedToIframe) {
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
      throw new Error(`Clickable element not found with ${targetId}`);
    }
  }
  if (switchedToIframe) {
    await driver.switchTo().defaultContent();
  }
}

async function clickInElement(
  driver: WebDriver,
  element: WebElement,
  targetId: string
) {
  const childElements = await element.findElements(By.css("*"));
  for (const childElement of childElements) {
    const cursorStyle = await driver.executeScript(
      "return window.getComputedStyle(arguments[0]).cursor",
      childElement
    );
    if (cursorStyle === "pointer") {
      await driver
        .actions({ bridge: true })
        .move({ origin: childElement })
        .perform();
      await driver.sleep(100);

      try {
        const targetElement = await findElement(driver, targetId, 10);
        await targetElement.click();
        return true;
      } catch (e) {
        console.log(`Failed to click on element: ${e}`);
      }
    }
  }
  return false;
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
  const switchedToIframe = await switchToIframeIfNeeded(driver, targetId);
  const element = await findElement(driver, targetId);

  inputValue = extractBetweenSymbols(inputValue);
  if (dataMap.has(inputValue)) {
    inputValue = dataMap.get(inputValue) || "";
  }

  console.log(`input value for ${targetId}: ${inputValue}`);
  await element.sendKeys(inputValue);

  let elementValue = await driver.executeScript(
    "return arguments[0].value",
    element
  );

  if (String(elementValue) !== String(inputValue)) {
    await driver.executeScript(`arguments[0].value = '${inputValue}'`, element);
  }

  if (switchedToIframe) {
    await driver.switchTo().defaultContent();
  }
}

export async function extractInfo(
  driver: WebDriver,
  targetId: string,
  key: string,
  dataMap: Map<string, string>
) {
  const switchedToIframe = await switchToIframeIfNeeded(driver, targetId);
  const element = await findElement(driver, targetId);
  const value = await element.getText();

  dataMap.set(key, value);

  if (switchedToIframe) {
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
  const switchedToIframe = await switchToIframeIfNeeded(driver, targetId);
  if (optionText === undefined) {
    throw new Error("optionText is required");
  }

  optionText = extractBetweenSymbols(optionText);

  if (dataMap && dataMap.has(optionText)) {
    optionText = dataMap.get(optionText) || optionText;
  }

  try {
    const element = await findElement(driver, targetId, 10000);
    if (await selectFromElement(element, optionText)) {
      if (switchedToIframe) {
        await driver.switchTo().defaultContent();
      }
      return;
    }
  } catch (e) {
    console.log(e);
    console.log("Initial search failed, try expanding search area");
  }

  const cssSelector = trimIframeIdentifiers(targetId)
    .split(";")
    .find((part) => part.startsWith("css="))
    ?.replace("css=", "");
  if (cssSelector) {
    let selectors = cssSelector.split(" > ");
    while (selectors.length > 0) {
      try {
        const currentSelector = selectors.join(" > ");
        const elements = await findElements(
          driver,
          `css=${currentSelector}`,
          1000
        );
        for (const element of elements) {
          if (await selectFromElement(element, optionText)) {
            if (switchedToIframe) {
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
  const switchedToIframe = await switchToIframeIfNeeded(driver, targetId);
  const element = await findElement(driver, targetId);
  const screenshot = await element.takeScreenshot(true);
  const filePath = path.join(
    __dirname,
    "file",
    `${fileName}.png` || "no_name.png"
  );
  fs.writeFileSync(filePath, screenshot, "base64");
  console.log(`screenshot saved: ${filePath}`);
  if (switchedToIframe) {
    await driver.switchTo().defaultContent();
  }
}

export async function acceptPopup(driver: WebDriver) {
  try {
    await driver.wait(until.alertIsPresent(), 2000);
    const alert = await driver.switchTo().alert();
    await alert.accept();
    console.log("Popup handled and accepted");
  } catch (e) {
    console.log("No popup appeared within 2 seconds.");
  }
}
