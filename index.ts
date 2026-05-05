import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { parseArgs } from "util";

puppeteer.use(StealthPlugin());

async function vote(
  auth_url: string,
  targetName: string,
  categoryName: string,
) {
  console.log(`\n--- Starting session for: ${auth_url} ---`);

  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log(`Navigating to authentication URL...`);
  await page.goto(auth_url);
  await page.waitForNetworkIdle();

  console.log("Navigating to home page...");
  await page.goto(
    "https://rbj.net/events/reader-rankings/reader-rankings-interface",
  );
  await page.waitForNetworkIdle();

  console.log("Searching for the Second Street iframe...");
  const iframeHandle = await page.waitForSelector(
    'iframe[src*="secondstreetapp.com"]',
  );

  const frame = await iframeHandle?.contentFrame();

  if (!frame) {
    console.log(
      "❌ Error: Unable to find or access the content frame of the iframe.",
    );
    await browser.close();
    return;
  }
  console.log("✅ Successfully attached to iframe.");

  await frame.evaluate((targetText) => {
    const groups: HTMLElement[] = Array.from(
      document.querySelectorAll(".ballot-group"),
    );
    const target = groups.find((el) => el.innerText.includes(targetText));

    if (target) {
      target.scrollIntoView();
      target.click();
    }
  }, categoryName);

  console.log("Waiting for categories to load...");
  await frame.waitForSelector(".category-name");

  console.log(`Scanning page for all instances of "${targetName}"...`);
  const actions = await frame.evaluate((target) => {
    const results: { category: string; entrantId: string }[] = [];

    const categoryHeaders = document.querySelectorAll(
      ".category-header__name-bar",
    );

    categoryHeaders.forEach((header) => {
      const categoryName = (
        header.querySelector(".category-name a") as HTMLElement
      )?.innerText.trim();

      const parentContainer =
        header.closest(".ballot-view-container") || header.parentElement;
      if (!parentContainer) return;

      const entrants = Array.from(
        parentContainer.querySelectorAll(".entrant-list-item"),
      );

      const targetMatch = entrants.find((el) => {
        const nameEl = el.querySelector(
          '[data-test="entrant-name"]',
        ) as HTMLElement;
        return nameEl?.innerText.trim() === target;
      });

      if (targetMatch) {
        const id = targetMatch.getAttribute("data-entrant-id");
        if (id) {
          results.push({ category: categoryName, entrantId: id });
        }
      }
    });

    return results;
  }, targetName);

  console.log(`Found ${targetName} in ${actions.length} categories.`);

  for (const action of actions) {
    console.log(
      `Processing category: "${action.category}" (ID: ${action.entrantId})`,
    );

    const selector = `[data-entrant-id="${action.entrantId}"] button.vote-button`;
    const voteButton = await frame.$(selector);

    if (voteButton) {
      console.log(
        `Clicking vote button for "${targetName}" in "${action.category}"...`,
      );
      await voteButton.click();
      console.log(
        `✅ Successfully voted for "${targetName}" in category: "${action.category}"`,
      );

      await voteButton.scrollIntoView();

      console.log("Waiting 5 seconds for vote cooldown...");
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      console.log(
        `⚠️  Warning: Vote button not found for category "${action.category}", likely already`,
      );
    }
  }

  console.log("Closing browser for this session.");
  await browser.close();
  console.log(`--- Finished processing: ${auth_url} ---\n`);
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      target: {
        type: "string",
        short: "t",
      },
      category: {
        type: "string",
        short: "c",
      },
    },
    strict: false,
    allowPositionals: true,
  });

  let targetName =
    typeof values.target === "string" ? values.target.trim() : undefined;
  if (!targetName) {
    targetName = prompt(
      "Name of company to vote for (Case Sensitive): ",
    )?.trim();
  }

  let categoryName =
    typeof values.category === "string" ? values.category.trim() : undefined;
  if (!categoryName) {
    categoryName = prompt(
      "Name of category to vote for (Case Sensitive): ",
    )?.trim();
  }

  if (!targetName || !categoryName) {
    console.log("❌ Error: Target name and Category name are required.");
    process.exit(1);
  }

  console.log(`\n--- Voting Configuration ---`);
  console.log(`Target:   ${targetName}`);
  console.log(`Category: ${categoryName}`);
  console.log(`---------------------------\n`);

  console.log("Reading rbj_links.txt file...");
  const fileName = "rbj_links.txt";
  const file = Bun.file(fileName);

  if (!(await file.exists())) {
    console.log(`⚠️  "${fileName}" not found. Creating it now...`);
    await Bun.write(fileName, "");
  }

  const content = await file.text();
  const links = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (links.length === 0) {
    console.log(
      `❌ No links found in "${fileName}". Please add URLs to the file (separated by new lines) and restart.`,
    );
    process.exit(0);
  }

  console.log(`Loaded ${links.length} links to process.`);

  for (const link of links) {
    console.log(`Current link in queue: ${link}`);
    await vote(link, targetName, categoryName);
  }

  console.log("✅ All links have been processed.");
}

main();
