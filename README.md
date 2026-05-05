# RBJ Voting Automator

A specialized Puppeteer script built for Bun to automate voting on business ballots. It uses stealth plugins to avoid detection and supports batch processing via link files.

## 🚀 Prerequisites

- **[Bun](https://bun.sh/)** installed on your machine.
- A file named `rbj_links.txt` in the root directory (the script will create this automatically if it's missing).

## 📦 Installation

```bash
bun install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

## 🛠 Usage

You can run the script using command-line arguments to bypass the interactive prompts.

### Fast Track (CLI Arguments)
```bash
bun run index.ts --target "My Company Name" --category "Category"
```

### Interactive Mode
Simply run the script, and it will prompt you for the details:
```bash
bun run index.ts
```

## 📋 Configuration

1. **`rbj_links.txt`**: Paste your authentication URLs (one per line) into this file. The script will iterate through each link, open a browser, and cast the votes.
2. **Targeting**: The `targetName` and `categoryName` are case-sensitive and must match the text exactly as it appears on the ballot.

## ⚙️ Features

- **Stealth Mode**: Uses `puppeteer-extra-plugin-stealth` to bypass basic bot detection.
- **Auto-Wait**: Includes built-in delays (5s cooldown between votes) to ensure page stability.
- **Verbose Logging**: Provides real-time feedback on which category is being processed and the status of each vote.

---

**Disclaimer:** *This tool is for educational purposes only. Automated voting may violate the Terms of Service of the hosting platform. Use responsibly.*