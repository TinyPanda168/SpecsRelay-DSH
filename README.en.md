# SpecsRelay for DeepSeek Harness

[简体中文](README.md) | English

**Turn DeepSeek conversations into requirements your DSH Agent can execute.**

A plugin for the official [DeepSeek Harness Desktop](https://github.com/deepseek-ai/DeepSeek-Harness) and [community DSH Desktop by anywhere-labs](https://github.com/anywhere-labs/deepseek-harness-desktop), saving you from copying long chats and explaining the task again.

<a href="https://www.producthunt.com/products/specsrelay-for-deepseek" target="_blank" rel="noopener noreferrer"><img alt="Product Hunt launch rank number 66" width="250" height="54" src="assets/product-hunt-rank-66.svg"></a>

![SpecsRelay organizes a DeepSeek conversation and sends it to a DSH Agent](assets/specsrelay-dsh-hero.png)

## Highlights

- **Organize in one click**: extract goals, constraints and acceptance criteria, selecting clarification, coverage checks and revision reconciliation according to the content.
- **Switch enhancement services**: choose Off, Jev or your own Laya service for long-conversation evidence selection; the existing organizer writes the requirements.
- **Clarify as you go**: take open questions back to DeepSeek, then continue development.
- **Continue long tasks**: hand off current progress to a new session in the same project.
- **Reuse your model**: the default workflow uses your DSH model without entering its Key again.

Enhancement is off by default. Expand its sidebar settings, choose a service and save. Jev requires a TypeSafe Key; Laya takes a running service URL and optional model name. Failures fall back to the full conversation. Jev continuation routing is enabled separately. [Setup and data handling](docs/jev-features.en.md)

## Quick install

**Official DeepSeek Harness Desktop**: open the app's **Plugins** page, install `github:TinyPandaGame/SpecsRelay-DSH`, then restart. Configure a working DSH model first. Official Desktop uses its built-in browser API and needs no community native-page patch.

**Community DSH Desktop by anywhere-labs**: the client must provide `desktopWebPanels`; see [repair and upgrade checks](docs/desktop-native-repair.md). Run:

```sh
npx --yes github:TinyPandaGame/SpecsRelay-DSH install --app "/Applications/DSH Desktop.app"
```

Restart afterward. [Supported versions and installation](docs/usage.en.md#quick-install)

## How to use

1. Open **SpecsRelay** in the sidebar, sign in to DeepSeek and discuss your idea.
2. Select **Organize current conversation**, review the requirements and resolve open questions.
3. Choose a project and select **Send to DSH and start**.

## Documentation

[User guide](docs/usage.en.md) · [Optional enhancement (Jev / Laya)](docs/jev-features.en.md) · [Data and security](docs/usage.en.md#data-and-security) · [Changelog](CHANGELOG.en.md)

[MIT licensed](LICENSE) · Independent community plugin; not an official DeepSeek product.
