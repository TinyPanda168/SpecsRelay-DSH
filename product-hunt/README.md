# SpecsRelay for DeepSeek — Product Hunt launch pack

This folder contains the copy and image assets for the first Product Hunt launch of **SpecsRelay for DeepSeek**.

## Product scope

This launch is for the open-source plugin in this repository, which supports only **DSH Desktop by anywhere-labs**. The SpecsRelay Chrome extension is a separate product and installation path.

Primary product URL:

<https://github.com/TinyPanda168/SpecsRelay-DSH>

## Files

- `SUBMISSION.en.md` — copy-ready Product Hunt fields, first comment, FAQs, and launch posts.
- `SUBMISSION.zh.md` — Chinese reference for every public claim.
- `LAUNCH_CHECKLIST.md` — account, draft, scheduling, preview, and launch-day checks.
- `assets/thumbnail-240.png` — square Product Hunt thumbnail.
- `assets/gallery-01-deepseek-to-dsh.png` — main value proposition, 1270×760.
- `assets/gallery-02-workflow.png` — four-stage workflow, 1270×760.
- `assets/gallery-03-native-experience.png` — native desktop experience, 1270×760.
- `assets/social-card-1200x630.png` — optional launch-day social card.

The active gallery contains the three numbered images above. The gallery uses code-rendered text and the existing product concept image.

`SpecsRelay-for-DeepSeek-Product-Hunt-kit.zip` contains the current copy, scripts, and active assets. Historical promotional files are preserved in `archive/retired-multi-client/`; they are deprecated and excluded from the current ZIP and upload list.

## Rebuild images

The build script requires `sharp`. Run these commands from the repository root:

```sh
npm install --prefix product-hunt --no-save --package-lock=false sharp
node product-hunt/scripts/build-assets.cjs
```

Override the icon source when the SpecsRelay browser-extension repository is stored elsewhere:

```sh
SPECSRELAY_ICON=/absolute/path/to/specsrelay-icon-1024.png \
  node product-hunt/scripts/build-assets.cjs
```
