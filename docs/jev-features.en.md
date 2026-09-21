# Configure optional Jev features

[Back to README](../README.en.md#optional-features) · [简体中文](jev-features.md) | English

Jev provides long-conversation evidence selection and session-continuation routing. **Both are off by default and enabled independently.** The complete requirement-organization workflow works without Jev.

## Long-conversation enhancement

### Enable or disable

Obtain your own TypeSafe API Key and set these variables in the desktop client's `$DSH_HOME/.env` or the environment that launches DSH:

```sh
SPECSRELAY_JEV_LONG_CONTEXT=1
TYPESAFE_API_KEY=your_TypeSafe_API_Key
```

Never commit this local configuration file to a project repository. `SPECSRELAY_JEV_API_KEY` remains a compatibility alias for the Key.

> **Before enabling:** selection sends original conversation fragments to TypeSafe, potentially covering most of the conversation, including user content. Credential masking does not remove all sensitive information. Enable it only for conversations you allow TypeSafe to receive.

Set `SPECSRELAY_JEV_LONG_CONTEXT=0` or remove it to disable enhancement.

### How organization works

1. **Capture the full conversation**: the organizer uses the opening, recent discussion and current clarifications to plan searches for goals, confirmed decisions, constraints, acceptance criteria and open questions.
2. **Select original evidence**: [Jev / TypeSafe System One](https://docs.typesafe.ai/agent-skill) evaluates source fragments in batches.
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
| Enabled, Key available, conversation at least 24,000 characters | Select evidence automatically |
| Short conversation, disabled feature, missing Key or ambiguous role headers | Organize the full conversation directly |
| Planning or screening fails, times out or returns invalid results | Discard all selection results and organize the full source |

The 400,000-character import limit and the organizer model's context limit still apply. Chinese screening quality needs evaluation on real conversations. Automated tests verify ordering, retained text and fallbacks, not model accuracy or savings.

### Advanced parameters

Ordinary users do not need to set these. Maintainers can tune the following environment variables; invalid values report an error.

| Variable | Purpose | Default | Range |
| --- | --- | --- | --- |
| `SPECSRELAY_JEV_LONG_CONTEXT_MIN_CHARS` | Character count that triggers enhancement | 24,000 | 1,000–400,000 |
| `SPECSRELAY_JEV_LONG_CONTEXT_TIMEOUT_MS` | Total enhancement timeout, milliseconds | 20,000 | 100–60,000 |
| `SPECSRELAY_JEV_OMIT_PROBABILITY` | Probability threshold for omitting assistant fragments | 0.98 | 0.9–1 |

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

Keys are resolved per operation through DSH credentials or the launch environment. They are used only for authentication, never as selection evidence, and are not written to plugin configuration, workspace state or logs.
