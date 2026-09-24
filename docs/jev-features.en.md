# Configure optional enhancement: Jev and Laya

[Back to README](../README.en.md#documentation) · [简体中文](jev-features.md) | English

Long-conversation enhancement offers **Off / Jev / Laya**, with Off as the default. Jev also provides independently enabled session-continuation routing. The complete organization workflow works without either service.

## Long-conversation enhancement

### Enable or disable

Expand **Long-conversation enhancement** in the SpecsRelay sidebar, choose a service, then save. The next organization uses the saved choice without a restart; an in-flight request keeps its initial settings. Switching providers retains the saved Laya address and model name.

| Choice | Configuration | Behavior |
| --- | --- | --- |
| Off | None | Organize the complete text without an enhancement request |
| Jev | TypeSafe Key in DSH credentials or environment | Send long-conversation fragments to TypeSafe |
| Laya | Running service URL and optional model name | Send fragments to the selected Laya service; never switch to Jev |

The plugin does not download models, install Python or start inference. A local weight directory is loaded by the service, not entered as an HTTP URL. Settings apply across projects in the current plugin instance and are stored under the local state directory (default `~/.specsrelay/workspace-state`). Only the provider, URL and model name are stored, never credentials. **Saved UI settings override environment variables, including an explicit Off choice.**

Before any UI settings have been saved, the legacy environment switch remains supported. For Jev, obtain a TypeSafe Key and set these variables in the desktop client's `$DSH_HOME/.env` or launch environment:

```sh
SPECSRELAY_JEV_LONG_CONTEXT=1
TYPESAFE_API_KEY=your_TypeSafe_API_Key
```

Never commit this local configuration file to a project repository. `SPECSRELAY_JEV_API_KEY` remains a compatibility alias for the Key.

> **Before enabling:** selection sends original conversation fragments to TypeSafe, potentially covering most of the conversation, including user content. Credential masking does not remove all sensitive information. Enable it only for conversations you allow TypeSafe to receive.

Before saving UI settings, set `SPECSRELAY_JEV_LONG_CONTEXT=0` or remove it to disable enhancement. After saving UI settings, choose **Off** and save there. Launch-environment changes require a client restart.

### Laya HTTP configuration

Deploy the service using the [upstream instructions](https://github.com/NandhaKishorM/laya#self-hosting-http-server-jev-compatible), then enter:

- **Service URL**: for example `http://127.0.0.1:8000`. A `/v1` suffix or full `/v1/systemone` endpoint is also accepted. The adapter calls `POST /v1/systemone`, not OpenAI chat completions.
- **Model name**: defaults to `multilingual` and is forwarded as `model`. Leave blank for server selection. The stock server recognizes registered names such as `english`, `multilingual` and `typed-decisions`; arbitrary weight paths are not automatically loaded by its HTTP handler. Custom names depend on your service.
- **Optional authentication**: set `SPECSRELAY_LAYA_API_KEY` in DSH credentials or its launch environment when the service requires a Bearer Key. Jev credentials are never reused. Do not embed credentials in the URL.

Before saving UI settings, environment configuration is also supported:

```sh
SPECSRELAY_ENHANCEMENT_PROVIDER=laya
SPECSRELAY_LAYA_URL=http://127.0.0.1:8000
SPECSRELAY_LAYA_MODEL=multilingual
```

`SPECSRELAY_ENHANCEMENT_PROVIDER` accepts `off`, `jev` or `laya` and overrides the legacy switch. Configuring a URL alone does not enable enhancement. The plugin bundles neither the Laya SDK nor weights. Local mock HTTP tests verify protocol handling, switching and fallbacks; live-model Chinese quality and latency have not been evaluated.

### How organization works

1. **Capture the full conversation**: the organizer uses the opening, recent discussion and current clarifications to plan searches for goals, confirmed decisions, constraints, acceptance criteria and open questions.
2. **Select original evidence**: the selected Jev or Laya service evaluates source fragments.
3. **Write requirements**: the original organizer reads retained fragments in their original order, interprets them and writes Specs.

Everything runs within one **Organize current conversation** action, with no separate compression step or ratio to choose. Enhancement selects neither the organizer model nor your Coding Agent's main model.

### What is retained

- All identifiable user text, role labels and the latest two messages.
- Assistant content containing new information, and content whose usefulness is uncertain.
- Judgments receive adjacent fragments and excerpts of preceding and following user messages to help preserve referenced proposals.

Only assistant fragments judged with high probability to be entirely chatter or repetition without new information are omitted. Retained fragments keep their order, and the original conversation is not overwritten.

### When the full source is used

| Situation | Behavior |
| --- | --- |
| Service selected, conversation at least 24,000 characters; Jev also requires a Key | Select evidence automatically |
| Short conversation, disabled feature, missing Jev Key or ambiguous role headers | Organize the full conversation directly |
| Planning or screening fails, times out or returns invalid results | Discard all selection results and organize the full source |
| A Laya candidate and its context exceed the request budget | Retain that candidate without truncating the context for judgment |
| Selected text is not shorter | Use the full source |

The 400,000-character import limit and the organizer model's context limit still apply. Chinese screening quality needs evaluation on real conversations. Automated tests verify ordering, retained text and fallbacks, not model accuracy or savings.

### Advanced parameters

Ordinary users do not need to set these. The existing length threshold and total timeout apply to both providers.

| Variable | Purpose | Default | Range |
| --- | --- | --- | --- |
| `SPECSRELAY_JEV_LONG_CONTEXT_MIN_CHARS` | Character count that triggers enhancement | 24,000 | 1,000–400,000 |
| `SPECSRELAY_JEV_LONG_CONTEXT_TIMEOUT_MS` | Total enhancement timeout, milliseconds | 20,000 | 100–60,000 |
| `SPECSRELAY_JEV_OMIT_PROBABILITY` | Probability threshold for omitting assistant fragments | 0.98 | 0.9–1 |
| `SPECSRELAY_LAYA_OMIT_PROBABILITY` | Separate Laya threshold, not calibrated against a live model | 0.995 | 0.9–1 |
| `SPECSRELAY_LAYA_MAX_REQUEST_BYTES` | Total bytes per Laya request | 900 | 400–30,000 |

Laya evaluates one candidate per request with a shorter judgment question. The conservative 900-byte budget is not an exact token count; oversized evidence is retained, which may leave the entire source unchanged. The upstream multilingual model defaults to 1,024 tokens, and the stock HTTP handler currently does not forward the SDK's `max_len` option. Only raise the byte budget after verifying the deployed service's capacity. Increasing this budget does not change server context limits. Separate probability thresholds do not imply equivalent calibration or accuracy.

## Continuation routing

To select an auxiliary organizer model for **Continue session**, set these in the same local configuration file:

```sh
SPECSRELAY_JEV_ROUTER=1
TYPESAFE_API_KEY=your_TypeSafe_API_Key
```

- Off by default, enabled independently of long-conversation enhancement, with the same optional Key.
- Fewer than two available models or a failed request preserves the original route.
- This flag does not enable enhancement, and requirement organization does not use it to select a model.
- Your Coding Agent's main model stays unchanged.

## Data sent to TypeSafe

| Feature | Data sent |
| --- | --- |
| Long-conversation enhancement | Reading questions, batches of source fragments and adjacent user context; potentially most of the conversation, without the 1,600-character excerpt limit |
| Continuation routing | A credential-redacted task excerpt of at most 1,600 characters, plus model candidates |

Common credentials and the current TypeSafe Key are masked before long-conversation slicing. Neither feature directly reads project files or tool results, although content pasted into the web conversation may include them.

With Laya selected, reading questions, candidate fragments and adjacent user context go to the configured Laya service instead of TypeSafe. DSH's configured organizer still generates the final Specs; selecting local Laya does not make the entire workflow offline.

Keys are resolved per operation through DSH credentials or the launch environment, used only for authentication, and never written to configuration, workspace state or logs. Laya redirects are rejected, and failures do not switch to Jev. This service selector controls long-conversation enhancement only; continuation routing retains its independent `SPECSRELAY_JEV_ROUTER` switch.
