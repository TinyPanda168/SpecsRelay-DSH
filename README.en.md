# SpecsRelay for DeepSeek Harness (Jev-enhanced)

[简体中文](README.md) | English

**Turn DeepSeek conversations into requirements your DSH Agent can execute.**

A plugin for [DSH Desktop by anywhere-labs](https://github.com/anywhere-labs/deepseek-harness-desktop) that saves you from copying long chats and explaining the task again.

<a href="https://www.producthunt.com/products/specsrelay-for-deepseek" target="_blank" rel="noopener noreferrer"><img alt="Product Hunt launch rank number 66" width="250" height="54" src="assets/product-hunt-rank-66.svg"></a>

![SpecsRelay organizes a DeepSeek conversation and sends it to a DSH Agent](assets/specsrelay-dsh-hero.png)

## Highlights

- **Organize in one click**: extract goals, constraints and acceptance criteria from the full conversation.
- **Optional Jev enhancement**: select evidence from long conversations and choose an auxiliary organizer model for session continuation.
- **Clarify as you go**: take open questions back to DeepSeek, then continue development.
- **Continue long tasks**: hand off current progress to a new session in the same project.
- **Reuse your model**: the default workflow uses your DSH model without entering its Key again.

Both Jev features are off by default. Enabling them requires a TypeSafe API Key and sends relevant conversation content to TypeSafe. [Setup and data handling](docs/jev-features.en.md)

## Quick install

Install and start DSH Desktop, configure a working model, then run:

```sh
npx --yes github:TinyPanda168/SpecsRelay-DSH install
```

Restart the client afterward. [Requirements and custom paths](docs/usage.en.md#quick-install)

## How to use

1. Open **SpecsRelay** in the sidebar, sign in to DeepSeek and discuss your idea.
2. Select **Organize current conversation**, review the requirements and resolve open questions.
3. Choose a project and select **Send to DSH and start**.

## Documentation

[User guide](docs/usage.en.md) · [Optional Jev features (off by default)](docs/jev-features.en.md) · [Data and security](docs/usage.en.md#data-and-security) · [0.10.0 changelog](CHANGELOG.en.md)

[MIT licensed](LICENSE) · Independent community plugin for DSH Desktop by anywhere-labs only. Not an official DeepSeek product.
