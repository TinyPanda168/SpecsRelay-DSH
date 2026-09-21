# Third-party notices

## AI Chat Exporter

- Project: <https://github.com/TheBluCoder/AI-chat-exporter>
- Upstream commit: `3253d7696a112204137c4c3a1843a3c7d20e14b9`
- License: MIT
- Copyright: 2024 AI Chat Exporter Contributors

The DeepSeek capture sweep follows the virtualized-turn collection strategy already adapted for SpecsRelay's Capture Engine. The complete upstream license is preserved at `third_party/AI-chat-exporter/LICENSE`.

## Jev Codex Router

- Project: <https://github.com/0xNatoshi/jev-codex-router>
- Role: design reference for optional, typed auxiliary-model selection and fail-open routing

SpecsRelay implements its Jev integration independently against the public [TypeSafe System One API](https://docs.typesafe.ai/api) and follows the current [TypeSafe agent-skill guidance](https://docs.typesafe.ai/agent-skill). No Jev Codex Router or TypeSafe skill source code is vendored or copied. Optional continuation routing selects auxiliary models only for session-continuation calls. Separately enabled long-conversation enhancement uses typed judgments to select source evidence inside requirement organization, following the [evidence re-ranking pattern](https://docs.typesafe.ai/cookbooks/rerank_typesafe). Neither feature routes the user's Coding Agent.
