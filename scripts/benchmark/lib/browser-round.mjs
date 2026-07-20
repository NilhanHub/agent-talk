import { chromium } from "playwright-core";

import { detectChromeExecutable } from "./common.mjs";

export const runBrowserBenchmarkRound = async ({
  baseUrl,
  scenario,
}) => {
  const executablePath = await detectChromeExecutable();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/?benchmark=1`, {
      waitUntil: "networkidle",
    });

    const result = await page.evaluate(async (scenarioInput) => {
      if (!window.__agentTalkBenchmark__) {
        throw new Error("Benchmark hook is not available.");
      }

      return window.__agentTalkBenchmark__.runRound({
        scenario: scenarioInput,
      });
    }, scenario);

    return result;
  } finally {
    await browser.close();
  }
};
