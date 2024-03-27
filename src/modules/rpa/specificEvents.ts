import { WebDriver } from "selenium-webdriver";
import { clickElement, findElement, getFindBy } from "./actionEvents";
import { keyDict, symbolKeyList } from "./keyDict";

export async function inputCert(
  driver: WebDriver,
  targetId: string,
  inputValue?: string,
  dataMap?: Map<string, string>
) {
  if (!inputValue || !dataMap) {
    throw new Error("inputValue or dataMap is required");
  }

  if (dataMap.has(inputValue)) {
    inputValue = dataMap.get(inputValue) || "";
  }

  await clickElement(driver, targetId);

  const keySequence = getKeySequence(inputValue);
  const keyboardTypes = identifyKeyboardType(keySequence);
  for (const [index, key] of keySequence.entries()) {
    const targetId = `css=${keyboardTypes[index]} > .kpd-data:nth-child(${keyDict[key]})`;
    const element = await findElement(driver, targetId, 10000);

    try {
      console.log("key: ", keySequence[index], ", targetId: ", targetId);
      await element.click();
    } catch (e) {
      console.log(e, targetId);
    }
    await driver.sleep(100);
  }
}

function identifyKeyboardType(keySequence: string[]): string[] {
  let currentKeyboardType = ".lower";
  const output: string[] = [];

  keySequence.forEach((key) => {
    output.push(currentKeyboardType);
    if (currentKeyboardType === ".lower") {
      if (key === "shift") {
        currentKeyboardType = ".upper";
      } else if (key === "symbol") {
        currentKeyboardType = ".special";
      }
    } else if (currentKeyboardType === ".upper") {
      if (key === "shift") {
        currentKeyboardType = ".lower";
      } else if (key === "symbol") {
        currentKeyboardType = ".special";
      }
    } else if (currentKeyboardType === ".special") {
      if (key === "symbol") {
        currentKeyboardType = ".lower";
      } else if (key === "shift") {
        currentKeyboardType = ".special";
      }
    }
  });

  return output;
}

function getKeySequence(inputValue: string): string[] {
  const output: string[] = [];
  let isShift = false; // 대문자 입력 상태
  let isSymbol = false; // 심볼 입력 상태

  for (const char of inputValue) {
    if (/[A-Z]/.test(char)) {
      // 대문자인 경우
      if (!isShift) {
        output.push("shift");
        isShift = true;
      }
      if (isSymbol) {
        output.push("symbol");
        isSymbol = false;
      }
      output.push(char.toLowerCase());
    } else if (/[a-z]/.test(char)) {
      // 소문자인 경우
      if (isShift) {
        output.push("shift");
        isShift = false;
      }
      if (isSymbol) {
        output.push("symbol");
        isSymbol = false;
      }
      output.push(char);
    } else if (symbolKeyList.includes(char)) {
      // 심볼인 경우
      if (!isSymbol) {
        output.push("symbol");
        isSymbol = true;
      }
      output.push(char);
    } else {
      // 그 외 문자
      if (isShift) {
        output.push("shift");
        isShift = false;
      }
      if (isSymbol) {
        output.push("symbol");
        isSymbol = false;
      }
      output.push(char);
    }
  }

  // 마지막으로 토글 상태 복원
  if (isShift) {
    output.push("shift");
  }
  if (isSymbol) {
    output.push("symbol");
  }

  output.push("enter");

  return output;
}
