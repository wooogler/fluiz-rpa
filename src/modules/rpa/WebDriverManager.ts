import { Builder, WebDriver } from "selenium-webdriver";
import path from "path";

let instance: null | WebDriver = null;

class WebDriverManager {
  static async getDriver() {
    if (instance) {
      return instance;
    }

    const chromeDriverPath = path.join(
      __dirname,
      "src",
      "modules",
      "rpa",
      "chromedriver.exe"
    );
    process.env["webdriver.chrome.driver"] = chromeDriverPath;

    instance = new Builder().forBrowser("chrome").build();
    return instance;
  }

  static async quitDriver() {
    if (instance) {
      await instance.quit();
      instance = null;
    }
  }
}

export default WebDriverManager;
