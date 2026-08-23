(function registerSpecsRelayDeepSeekClient() {
  const PLUGIN_ID = "@specsrelay/dsh-deepseek";
  globalThis.__ModuleLoader__.load({
    id: PLUGIN_ID,
    factory: (require) => {
      const React = require("react");
      const {
        createElement: h,
        useEffect,
        useMemo,
        useRef,
        useState,
        useSyncExternalStore
      } = React;
      const {
        Button,
        Pill,
        StateDot,
        Toast,
        IconArchiveOutline20,
        IconChevronLeftOutline14,
        IconCloseOutline16,
        IconEditOutline16,
        IconEnhanceOutline16,
        IconRefreshOutline16,
        IconSendOutline14,
        IconTrashOutline16,
        IconWarningOutline16
      } = require("@deepseek-ai/dsh-client-ui-primitives");

      const API = "/specsrelay/v1";
      const MAX_EXECUTION_SNAPSHOTS = 12;
      const MAX_REQUIREMENT_SOURCE_CHARS = 500000;
      const MAX_WORKSPACE_HISTORY = 3;
      const STATUS_MESSAGE_DURATION_MS = 4000;
      const WORKSPACE_STORAGE_PREFIX = "specsrelay.dsh.workspace.v1:";
      const SPECSRELAY_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAGGElEQVR42s2Xf2xVZxnHP897zj33Z7m3hd16W1rGjyEwhamkWn6YkVE7/L3gsikzJm5CdOBiFJeYxcSYkcBMHX+YBRKjhh9h0zm00VHNmBAGcRmbpTBG+TXWUtpbaGlv7217zz3v6x/3UqDrLbSSuDe5ObnJe87zfb7v83yf7wv/5yV3aM94y0wWmH0HE7WLJXLL7KLRGTGiZnIs9Inp67twdVQ8Mx6Akf9l8cqnsOXbglQZgwV5EAIYbTBaX99txkzNgHggFzFmV293RwOgR4OQUcEFkFg88aJl2auzAxm8rAtyfZsxBtvv4Av6McaMldTNOEQQUWgv19jbfWk14BVeMKMB2EAuVp74oaXsre7QcLZ62SK7bM50yQ1lEaXAGCy/j853WulqOYPtOJhCcOPp8YrQVcryay/3dG/3pS3XYo3JQNnHKptzQ+6C0lkVZk3TVssJBTAYjM5nawccuo+f5XfL16HdHKaQpX9KOM+UGZMNLSIYo8/2Ji8tKLAAYKwbiyM6Y0ZUefqZ3FA2NHVutdx9/6el8fFn8UcjHPzlb7EdH68/s40Fj6xk1gOLufeROuavXoETDpI8dgaQPFNjL2UQxy4Jb88ODKSvJX9zqxkjgAiCznmEy8uo3fgYsZkJpkyPE46XEptViWVb9J67SG7IJRCLsHLLeqqX38ffn3wOy3LGFwVzc0d9qNeNNlgBh95zF2k71MycLy6h53Qbls8mc/kqgWiEYzub+MdPtuIE/OSGshzdvpc1+57n/Gtv0bK7iWBpCbp4TTAuAIxB+WwyyV7e2LwDlLBvQwPZVBpl2xijcQeHiVbEGUinsUIOHUeO09p4iDmrajm249UJSd+YB2Y8DycSpK+ti8YnNjF4pQ9E8HI5tKcJloS5cvkyy5csobamhkE9SDQxjWx6sFBQMiGJLNbAuOkhRMAOOhhtUJbCsm2SyW4eWLGCl/bsoiQYZs1T38fESzj1/B4sxy7ow//AwAgGJaAEow2iFNr16LnYRX1dHX98cTfRkgh/2vsKD3/hy+id/6Z1/5v4I6G8St4JANdkRJTCzQwSrSqn5sffpOHXv+I/7zTz0OqH+c0L2/hczWLWfv3RfOYysbFxSwAigpd1Cd9VyjdeepZ7H1rB2g1PEovF+Pi8eezZvQNRirUb1uMEAohSiJX/qcJzcjUwcgyKbCrD53/+XXKuy8tf/Sl9/X08vm4dhw8eoD/Vz8r6VbS83UwkGCKdyuRLsMCEKIUTDhadu7cEYIxG+WwSn5nHqb8cJHM1RbyqghMn3qVmyTIs2+LkiXf5xIPLiFSXo90cooTcsAuAmx6k/XBLYXrKJBiQvCqmO3soX3gP2suR7ukj5A9w+r1W3MwQM2sXsmrb0/S0foAd8JNND1K1dCHByBQAGn+wiebf/w1/LALamygDYDk2R7fv5dG/Pkd9w49o2bkPRCizbbKpAeKfmksm2cupxkP4gn5ECZdPnscdHKZ62X2Uzq5Ee94kj0BrnEiI9iMtND6xift/8T0++a16tOfl2fE8gmVR9v/sBVp2NRGdHkf5LBKL53Pyz6/z/v6jzKqrKdodt+X78iCCvPfKAc6/9haxmQmUZYEI2VSa2Q/WgsDSjY+RPH6WkoppXDndRt3m9bz/r7fxsi5yWwBETDF7Y7TBHw2jcx7dJ86N6MNgXz/T5t/NlMo4hzb/gdl1n6W/PUnbG8fob0viCwcoX3TPiDhJPsaHABhA+i5cSMXiFZ1KJGbyemrdPCM0ohS+UKDwMQUCqfZuFn3nS4itcMIhbL+PqXOrGU6lqVq6iHP/fNMoyzIgXQOdnb03GiFrFBgvGC4JKmXVG2PcokJV4MkYg2XbpDq66Wn9AF8oSCbZw0BXL0P9aTw3R/vhFnP21SOuEwr6tPYahtKpA4VYupgptUrvSrysLPsrxujbGiyiBDczTN47yghIg8GyLfwlETztNV2dEvoaZ864xUzpjb7dKi1PbBQjawxMN6OOohiIvO+7/lWV934dxtO7e5IdWwB3PFs+1uVBIonE1LDWamCCd5IIkBYxA52dV67RfUsP/1G8mskdAmD4qK7/Aogcgw2IpLcjAAAAAElFTkSuQmCC";
      const listeners = new Set();
      let snapshot = Object.freeze({ items: [], loading: false, error: "" });

      function publish(patch) {
        snapshot = Object.freeze({ ...snapshot, ...patch });
        for (const listener of listeners) listener();
      }

      const inbox = {
        subscribe(listener) {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        getSnapshot() {
          return snapshot;
        },
        async refresh() {
          publish({ loading: true, error: "" });
          try {
            const response = await fetch(`${API}/handoffs`, {
              cache: "no-store"
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || `HTTP ${response.status}`);
            }
            const items = Array.isArray(data.items) ? data.items : [];
            publish({ items, loading: false, error: "" });
            return items;
          } catch (error) {
            publish({
              loading: false,
              error: error instanceof Error ? error.message : String(error)
            });
            return [];
          }
        },
        async latest() {
          const response = await fetch(`${API}/handoffs/latest`, {
            cache: "no-store"
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
          }
          return data.item || null;
        },
        async receipt(item, sessionId) {
          const response = await fetch(`${API}/receipts`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ handoffId: item.handoffId, sessionId })
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
          }
          publish({
            items: snapshot.items.map((candidate) =>
              candidate.handoffId === item.handoffId
                ? {
                    ...candidate,
                    state: "loaded",
                    loadedAt: data.loadedAt || new Date().toISOString(),
                    sessionId
                  }
                : candidate
            )
          });
          return data;
        }
      };

      async function readWorkspaceState(key) {
        const response = await fetch(
          `${API}/workspace-state?key=${encodeURIComponent(key)}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        return data.item?.state ?? null;
      }

      async function writeWorkspaceState(key, state) {
        const response = await fetch(`${API}/workspace-state`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key, state })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        return data;
      }

      function useInbox() {
        return useSyncExternalStore(
          inbox.subscribe,
          inbox.getSnapshot,
          inbox.getSnapshot
        );
      }

      function listLines(values) {
        return Array.isArray(values) && values.length
          ? values.map((value) => `- ${value}`).join("\n")
          : "- 无";
      }

      function formatHandoffPrompt(handoff) {
        return `请根据以下由 SpecsRelay 从 DeepSeek 当前对话整理出的需求继续工作。先核对本地项目事实，再执行；不要假设对话中未确认的路径或实现。

标题：${handoff.title}

目标：
${handoff.objective}

背景：
${handoff.context}

已确认决策：
${listLines(handoff.decisions)}

实施建议：
${listLines(handoff.implementation_plan)}

验收标准：
${listLines(handoff.acceptance_criteria)}

约束：
${listLines(handoff.constraints)}

非目标：
${listLines(handoff.non_goals)}

需要本地核查：
${listLines(handoff.local_context_needed)}

未解决问题：
${listLines(handoff.open_questions)}`;
      }

      function normalizedPath(value) {
        const text = String(value || "")
          .trim()
          .replaceAll("\\", "/")
          .replace(/\/+$/, "");
        return /^[A-Za-z]:\//.test(text) ? text.toLowerCase() : text;
      }

      function relativeTime(value) {
        const time = Date.parse(value);
        return Number.isFinite(time) ? new Date(time).toLocaleString() : "";
      }

      function normalizeImportedText(value) {
        const text = String(value || "").trim();
        if (!text) throw new Error("没有读取到对话内容，请打开有内容的 DeepSeek 对话后重试。");
        if (text.length > MAX_REQUIREMENT_SOURCE_CHARS) {
          throw new Error(
            `DeepSeek 对话不能超过 ${MAX_REQUIREMENT_SOURCE_CHARS.toLocaleString()} 个字符。`
          );
        }
        return text;
      }

      function stableHash(value) {
        let hash = 0x811c9dc5;
        const source = String(value ?? "");
        for (let index = 0; index < source.length; index += 1) {
          hash ^= source.charCodeAt(index);
          hash = Math.imul(hash, 0x01000193);
        }
        return (hash >>> 0).toString(16).padStart(8, "0");
      }

      function normalizeSources(value) {
        if (!Array.isArray(value)) return [];
        const seen = new Set();
        const normalized = [];
        for (const item of value) {
          const transcript = String(item?.transcript || "").trim();
          if (!transcript || transcript.length > MAX_REQUIREMENT_SOURCE_CHARS) continue;
          const kind = item?.kind === "chatbot" ? "chatbot" : "paste";
          const identity = `${kind}:${stableHash(transcript)}`;
          if (seen.has(identity)) continue;
          seen.add(identity);
          normalized.push({
            id: String(item?.id || `source_${stableHash(identity)}`).slice(0, 120),
            identity,
            kind,
            provider: String(item?.provider || "DeepSeek").slice(0, 120),
            title: String(item?.title || "DeepSeek 对话").slice(0, 500),
            transcript,
            message_count: Number.isInteger(item?.message_count)
              ? Math.max(0, item.message_count)
              : 0,
            primary: Boolean(item?.primary),
            created_at: item?.created_at || new Date().toISOString(),
            updated_at: item?.updated_at || new Date().toISOString()
          });
          break;
        }
        return normalized.map((source) => ({
          ...source,
          primary: true
        }));
      }

      function addCapturedRequirementSource(capture) {
        const transcript = normalizeImportedText(capture?.transcript);
        const identity = `capture:${stableHash(transcript)}`;
        const now = new Date().toISOString();
        return normalizeSources([
          {
            id: `source_${stableHash(`${identity}:${capture?.captureId || now}`)}`,
            identity,
            kind: "chatbot",
            provider: "DeepSeek",
            title: String(capture?.title || "当前 DeepSeek 网页对话").slice(0, 500),
            transcript,
            message_count: Number.isInteger(capture?.messageCount)
              ? capture.messageCount
              : 0,
            primary: true,
            created_at: capture?.capturedAt || now,
            updated_at: now
          }
        ]);
      }

      function sourcesFingerprint(sources) {
        const normalized = normalizeSources(sources);
        return normalized.length
          ? `sources:${stableHash(
              JSON.stringify(
                normalized.map((source) => ({
                  id: source.id,
                  primary: source.primary,
                  hash: stableHash(source.transcript)
                }))
              )
            )}`
          : "";
      }

      function formatSourcesTranscript(sources) {
        return normalizeSources(sources)[0]?.transcript ?? "";
      }

      function normalizeWorkspace(value) {
        const source = value && typeof value === "object" ? value : {};
        return {
          sources: normalizeSources(source.sources),
          integratedFingerprint:
            typeof source.integratedFingerprint === "string"
              ? source.integratedFingerprint
              : "",
          handoff:
            source.handoff && typeof source.handoff === "object"
              ? source.handoff
              : null,
          answers: Array.isArray(source.answers)
            ? source.answers.map((answer) => String(answer || ""))
            : [],
          history: Array.isArray(source.history)
            ? source.history.slice(0, MAX_WORKSPACE_HISTORY)
            : [],
          executionHistory: normalizeExecutionHistory(source.executionHistory),
          organizerRoute:
            source.organizerRoute && typeof source.organizerRoute === "object"
              ? {
                  provider: String(source.organizerRoute.provider || ""),
                  model: String(source.organizerRoute.model || "")
                }
              : { provider: "", model: "" }
        };
      }

      function workspaceSnapshot(sources, integratedFingerprint, handoff, answers) {
        return {
          savedAt: new Date().toISOString(),
          sources: normalizeSources(sources),
          integratedFingerprint,
          handoff,
          answers
        };
      }

      function snapshotHasContent(snapshot) {
        return Boolean(snapshot.sources.length || snapshot.handoff);
      }

      function normalizeExecutionHistory(value) {
        if (!Array.isArray(value)) return [];
        return value
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              item.handoff &&
              typeof item.handoff === "object" &&
              typeof item.prompt === "string" &&
              item.prompt.trim()
          )
          .slice(0, MAX_EXECUTION_SNAPSHOTS)
          .map((item) => ({
            id: String(item.id || crypto.randomUUID()).slice(0, 160),
            createdAt: String(item.createdAt || new Date().toISOString()),
            handoff: item.handoff,
            projectPath: String(item.projectPath || ""),
            prompt: item.prompt,
            sources: normalizeSources(item.sources),
            status:
              item.status === "submitted"
                ? "submitted"
                : item.status === "loaded"
                  ? "loaded"
                  : "snapshot",
            fingerprint: String(item.fingerprint || "")
          }));
      }

      function createExecutionSnapshot(handoff, projectPath, prompt, sources) {
        return {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          handoff,
          projectPath,
          prompt,
          sources: normalizeSources(sources),
          status: "submitted",
          fingerprint: stableHash(`${projectPath}\n${prompt}`)
        };
      }

      const textAreaStyle = {
        background: "var(--dsw-alias-bg-layer-1)",
        border: "1px solid var(--dsw-alias-border-l2)",
        borderRadius: 8,
        color: "var(--dsw-alias-label-primary)",
        font: "inherit",
        outline: "none",
        padding: 10,
        resize: "vertical",
        width: "100%"
      };

      function loadIntoSession(ctx, sessionId, item) {
        const list = ctx.sessions.list.getSnapshot();
        const summary = list.byId[sessionId];
        const actual = normalizedPath(summary?.cwd);
        const expected = normalizedPath(item.projectPath);
        if (!actual || actual !== expected) {
          return {
            ok: false,
            message: `请先在 DSH 选择项目：${item.projectPath}`
          };
        }
        const scope = ctx.sessions.scope(sessionId);
        if (!scope) {
          return { ok: false, message: "当前 DSH 会话尚未准备好。" };
        }
        const input = ctx.conversation.input.for(scope);
        input.setDraft(item.prompt);
        if (item.submit === true) input.submit();
        return { ok: true, sessionId, submitted: item.submit === true };
      }

      async function prepareProjectTarget(ctx, projectPath) {
        const expected = normalizedPath(projectPath);
        if (!expected) {
          return { ok: false, message: "请先选择项目目录。" };
        }
        const sessions = ctx.sessions.list.getSnapshot();
        const currentSessionId = sessions.current;
        const currentSession = currentSessionId
          ? sessions.byId[currentSessionId]
          : undefined;
        if (
          currentSessionId &&
          normalizedPath(currentSession?.cwd) === expected
        ) {
          return {
            ok: true,
            projectPath: currentSession.cwd,
            sessionId: currentSessionId
          };
        }
        let workspace = ctx.workspaces.list
          .getSnapshot()
          .items.find((candidate) => normalizedPath(candidate.path) === expected);
        if (!workspace) {
          workspace = await ctx.workspaces.create({ path: projectPath });
        }
        const sessionId = await ctx.workspaces.connectWorkspace(
          workspace.workspaceId
        );
        return { ok: true, projectPath: workspace.path, sessionId };
      }

      async function loadIntoProject(ctx, item) {
        const expected = normalizedPath(item.projectPath);
        const preparedSessionId = String(item.preparedSessionId || "");
        const sessions = ctx.sessions.list.getSnapshot();
        const prepared =
          preparedSessionId &&
          normalizedPath(item.preparedProjectPath) === expected &&
          sessions.byId[preparedSessionId]
            ? {
                ok: true,
                projectPath: item.preparedProjectPath,
                sessionId: preparedSessionId
              }
            : await prepareProjectTarget(ctx, item.projectPath);
        if (!prepared.ok) return prepared;
        const submitStartedAt = performance.now();
        const result = loadIntoSession(ctx, prepared.sessionId, {
          ...item,
          projectPath: prepared.projectPath
        });
        return result.ok
          ? {
              ...result,
              projectPath: prepared.projectPath,
              submitLatencyMs: performance.now() - submitStartedAt
            }
          : result;
      }

      const stepCardStyle = {
        background: "var(--dsw-alias-bg-layer-1)",
        border: "1px solid var(--dsw-alias-border-subtle)",
        borderRadius: 14,
        display: "grid",
        gap: 14,
        padding: 14
      };

      function WorkflowStep({ children, description, number, title }) {
        return h(
          "section",
          { style: stepCardStyle },
          h(
            "header",
            { style: { alignItems: "flex-start", display: "flex", gap: 10 } },
            h(
              "span",
              {
                style: {
                  alignItems: "center",
                  background: "color-mix(in srgb, var(--dsw-alias-brand-primary, #35d39a) 14%, transparent)",
                  border: "1px solid var(--dsw-alias-brand-primary, #35d39a)",
                  borderRadius: 7,
                  color: "var(--dsw-alias-brand-primary, #35d39a)",
                  display: "inline-flex",
                  flex: "0 0 24px",
                  fontSize: 12,
                  fontWeight: 700,
                  height: 24,
                  justifyContent: "center"
                }
              },
              String(number)
            ),
            h(
              "div",
              { style: { display: "grid", gap: 3, minWidth: 0 } },
              h("h2", { style: { fontSize: 16, margin: 0 } }, title),
              description &&
                h(
                  "p",
                  {
                    style: {
                      color: "var(--dsw-alias-text-tertiary)",
                      fontSize: 12,
                      lineHeight: 1.5,
                      margin: 0
                    }
                  },
                  description
                )
            )
          ),
          children
        );
      }

      function HandoffSummaryPanel({
        answers,
        busy,
        handoff,
        onAnswer,
        onClarify
      }) {
        const questions = Array.isArray(handoff.open_questions)
          ? handoff.open_questions
          : [];
        return h(
          React.Fragment,
          null,
          questions.length > 0 &&
            h(
              "section",
              {
                "aria-label": "AskQuestion · 需求补充",
                style: {
                  background: "var(--dsw-alias-bg-layer-2)",
                  border: "1px solid var(--dsw-alias-brand-primary, #35d39a)",
                  borderRadius: 10,
                  display: "grid",
                  gap: 10,
                  padding: 12
                }
              },
              h("strong", null, "需要你确认"),
              h(
                "p",
                { style: { color: "var(--dsw-alias-text-secondary)", fontSize: 12, lineHeight: 1.5, margin: 0 } },
                "以下问题会影响需求范围或产品行为。回答完整后，SpecsRelay 会继续整理。"
              ),
              ...questions.map((question, index) =>
                h(
                  "label",
                  { key: question, style: { display: "grid", gap: 6 } },
                  h("span", { style: { fontSize: 12 } }, `${index + 1}. ${question}`),
                  h("textarea", {
                    rows: 3,
                    value: answers[index] || "",
                    placeholder: "输入你的决定、偏好或补充背景…",
                    style: textAreaStyle,
                    onChange: (event) => onAnswer(index, event.target.value)
                  })
                )
              ),
              h(
                "div",
                { style: { display: "grid", gap: 8 } },
                h(
                  Button,
                  {
                    disabled: Boolean(busy) || questions.some((_, index) => !answers[index]?.trim()),
                    icon: h(IconEnhanceOutline16),
                    variant: "primary",
                    onClick: onClarify
                  },
                  busy === "clarify" ? "继续整理中…" : "提交回答并继续整理"
                )
              )
            )
        );
      }

      function RequirementCheckStep({ children, handoff }) {
        const questions = Array.isArray(handoff?.open_questions)
          ? handoff.open_questions
          : [];
        if (!handoff || questions.length === 0) return null;
        const prompt = handoff ? formatHandoffPrompt(handoff) : "";
        return h(
          WorkflowStep,
          {
            number: 2,
            title: "检查并补充需求",
            description: "检查整理结果；如有待确认问题，补充完整后再进入载入步骤。"
          },
          h("textarea", {
            readOnly: true,
            rows: 12,
            value: prompt,
            placeholder: "整理当前 DeepSeek 对话后，这里会显示完整需求。",
            style: {
              ...textAreaStyle,
              color: "var(--dsw-alias-label-secondary)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              lineHeight: 1.5,
              minHeight: 220
            }
          }),
          children
        );
      }

      function DeliveryStep({
        alreadyLoaded,
        busy,
        handoff,
        onLoad,
        onSelectProject,
        projectPath,
        projectPreparing,
        sourcesChanged
      }) {
        const [confirmed, setConfirmed] = useState(false);
        const [loading, setLoading] = useState(false);
        const [message, setMessage] = useState("");
        const [selecting, setSelecting] = useState(false);
        const prompt = handoff ? formatHandoffPrompt(handoff) : "";
        const questions = Array.isArray(handoff?.open_questions)
          ? handoff.open_questions
          : [];
        const ready = Boolean(
          projectPath &&
            handoff?.ready_for_execution === true &&
            questions.length === 0 &&
            !sourcesChanged
        );
        useEffect(() => setConfirmed(false), [projectPath, prompt]);
        const selectProject = async () => {
          setSelecting(true);
          setMessage("");
          try {
            await onSelectProject();
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : String(error)
            );
          } finally {
            setSelecting(false);
          }
        };
        const load = async () => {
          setLoading(true);
          setMessage("");
          try {
            const result = await onLoad(prompt);
            setMessage(
              result.ok
                ? "已发送到 DSH；Agent 已开始处理。"
                : result.message
            );
            if (result.ok) setConfirmed(false);
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : String(error)
            );
          } finally {
            setLoading(false);
          }
        };
        return h(
          WorkflowStep,
          {
            number: questions.length > 0 ? 3 : 2,
            title: "发送到 DSH",
            description: ""
          },
          h(
            "div",
            {
              style: {
                alignItems: "stretch",
                display: "grid",
                gap: 8,
                gridTemplateColumns: "minmax(0, 1fr) auto"
              }
            },
            h(
              "code",
              {
                title: projectPath,
                style: {
                  alignItems: "center",
                  background: "var(--dsw-alias-bg-layer-2)",
                  border: "1px solid var(--dsw-alias-border-subtle)",
                  borderRadius: 9,
                  color: projectPath
                    ? "var(--dsw-alias-text-secondary)"
                    : "var(--dsw-alias-state-warning-primary)",
                  display: "flex",
                  fontSize: 11,
                  lineHeight: 1.5,
                  minWidth: 0,
                  overflowWrap: "anywhere",
                  padding: 10
                }
              },
              projectPath || "尚未选择项目目录"
            ),
            h(
              Button,
              {
                disabled:
                  Boolean(busy) ||
                  loading ||
                  selecting ||
                  projectPreparing ||
                  alreadyLoaded,
                size: "sm",
                variant: "outline",
                onClick: () => void selectProject()
              },
              selecting ? "选择中…" : "选择…"
            )
          ),
          alreadyLoaded &&
            h(
              "p",
              { style: { color: "var(--dsw-alias-brand-primary, #35d39a)", fontSize: 11, lineHeight: 1.45, margin: 0 } },
              "当前版本已经发送过。需要重开时请先从下方冻结快照恢复草稿；需要改需求时请基于快照继续修改。"
            ),
          h(
            "label",
            { style: { alignItems: "flex-start", display: "flex", fontSize: 12, gap: 7, lineHeight: 1.5 } },
            h("input", {
              type: "checkbox",
              checked: confirmed,
              disabled:
                !ready ||
                Boolean(busy) ||
                loading ||
                selecting ||
                projectPreparing ||
                alreadyLoaded,
              onChange: (event) => setConfirmed(event.target.checked)
            }),
            "我已核对项目目录和需求；发送后将立即启动 Agent。"
          ),
          h(
            Button,
            {
              disabled:
                !ready ||
                !confirmed ||
                Boolean(busy) ||
                loading ||
                selecting ||
                projectPreparing ||
                alreadyLoaded,
              icon: h(IconSendOutline14),
              variant: "primary",
              onClick: () => void load()
            },
            alreadyLoaded
              ? "当前版本已发送"
              : projectPreparing
                ? "正在准备 DSH…"
              : loading
                ? "正在发送…"
                : "发送到 DSH 并开始处理"
          ),
          message && h(Toast, { text: message, onDone: () => setMessage("") })
        );
      }

      function ExecutionSnapshotPanel({
        busy,
        history,
        onReload,
        onRevise
      }) {
        const [selectedId, setSelectedId] = useState(history[0]?.id || "");
        const [revisionOpen, setRevisionOpen] = useState(false);
        const [revisionInstruction, setRevisionInstruction] = useState("");
        const [message, setMessage] = useState("");
        useEffect(() => {
          if (!history.some((item) => item.id === selectedId)) {
            setSelectedId(history[0]?.id || "");
          }
        }, [history, selectedId]);
        if (history.length === 0) return null;
        const snapshot =
          history.find((item) => item.id === selectedId) || history[0];
        return h(
          "section",
          {
            "aria-label": "执行快照",
            style: {
              ...stepCardStyle,
              borderColor: "var(--dsw-alias-brand-primary, #35d39a)"
            }
          },
          h(
            "header",
            { style: { alignItems: "flex-start", display: "flex", gap: 8, justifyContent: "space-between" } },
            h(
              "div",
              null,
              h("div", { style: { color: "var(--dsw-alias-brand-primary, #35d39a)", fontSize: 11, fontWeight: 700 } }, "执行快照"),
              h("h2", { style: { fontSize: 16, lineHeight: 1.35, margin: "3px 0 0" } }, snapshot.handoff.title)
            ),
            h(
              Pill,
              { active: snapshot.status === "submitted" },
              snapshot.status === "submitted" ? "已发送" : "仅载入"
            )
          ),
          h(
            "p",
            { style: { color: "var(--dsw-alias-text-tertiary)", fontSize: 11, lineHeight: 1.45, margin: 0 } },
            snapshot.status === "submitted"
              ? "已发送到 DSH 的版本会被冻结；之后继续修改不会改变这一版。"
              : "这是旧版仅载入草稿的记录；重新载入不会启动 Agent。"
          ),
          h("strong", { style: { fontSize: 12 } }, "执行版本"),
          h(
            "select",
            {
              value: snapshot.id,
              style: { ...textAreaStyle, minHeight: 38, padding: "0 9px" },
              onChange: (event) => setSelectedId(event.target.value)
            },
            ...history.map((item) =>
              h(
                "option",
                { key: item.id, value: item.id },
                `${relativeTime(item.createdAt)} · ${item.handoff.title}`
              )
            )
          ),
          h(
            "div",
            { style: { color: "var(--dsw-alias-text-tertiary)", fontSize: 11, overflowWrap: "anywhere" } },
            `${relativeTime(snapshot.createdAt)} · DSH · ${snapshot.projectPath}`
          ),
          h(
            "section",
            {
              style: {
                background: "color-mix(in srgb, var(--dsw-alias-brand-primary, #35d39a) 8%, var(--dsw-alias-bg-layer-2))",
                border: "1px solid var(--dsw-alias-brand-primary, #35d39a)",
                borderRadius: 10,
                display: "grid",
                gap: 9,
                padding: 10
              }
            },
            h("p", { style: { color: "var(--dsw-alias-text-secondary)", fontSize: 11, lineHeight: 1.5, margin: 0 } }, "这份冻结快照可以重新载入为当前 DSH 草稿。"),
            h(
              Button,
              {
                disabled: Boolean(busy),
                icon: h(IconRefreshOutline16),
                variant: "primary",
                onClick: () => {
                  const result = onReload(snapshot);
                  setMessage(result.ok ? "已重新载入这份冻结快照。" : result.message);
                }
              },
              "重新载入此快照"
            )
          ),
          h(
            Button,
            { disabled: Boolean(busy), icon: h(IconEditOutline16), variant: "outline", onClick: () => setRevisionOpen((value) => !value) },
            "基于此版本继续修改"
          ),
          revisionOpen &&
            h(
              "section",
              { style: { display: "grid", gap: 8 } },
              h("textarea", {
                rows: 5,
                value: revisionInstruction,
                maxLength: 12000,
                placeholder: "例如：增加 iPad 横屏适配，但保留当前 DSH 范围。",
                style: textAreaStyle,
                onChange: (event) => setRevisionInstruction(event.target.value)
              }),
              h(
                Button,
                {
                  disabled: Boolean(busy) || !revisionInstruction.trim(),
                  icon: h(IconEnhanceOutline16),
                  variant: "primary",
                  onClick: () => {
                    onRevise(snapshot, revisionInstruction);
                    setRevisionOpen(false);
                    setRevisionInstruction("");
                  }
                },
                busy === "revision" ? "正在生成新版本…" : "生成新的需求版本"
              )
            ),
          message && h(Toast, { text: message, onDone: () => setMessage("") })
        );
      }

      function InboxCard({ item, loadDraft }) {
        const [message, setMessage] = useState("");
        const load = async () => {
          const result = loadDraft(item);
          if (!result.ok) {
            setMessage(result.message);
            return;
          }
          try {
            await inbox.receipt(item, result.sessionId);
            setMessage("已载入当前会话草稿，请检查后发送。");
          } catch (error) {
            setMessage(
              `草稿已载入，但回执失败：${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        };
        return h(
          "article",
          {
            style: {
              background: "var(--dsw-alias-bg-layer-2)",
              borderRadius: 10,
              display: "grid",
              gap: 9,
              padding: 12
            }
          },
          h("strong", null, item.title),
          h(
            "div",
            {
              style: {
                color: "var(--dsw-alias-text-tertiary)",
                fontSize: 12,
                wordBreak: "break-all"
              }
            },
            `${item.sourceProvider || "DeepSeek"} · ${relativeTime(item.receivedAt)}`
          ),
          h(
            "p",
            {
              style: {
                color: "var(--dsw-alias-text-secondary)",
                fontSize: 13,
                lineHeight: 1.55,
                margin: 0
              }
            },
            item.objective
          ),
          h(
            Button,
            {
              icon: h(IconSendOutline14),
              variant: "outline",
              onClick: () => void load()
            },
            item.state === "loaded" ? "重新载入草稿" : "载入当前会话草稿"
          ),
          message && h(Toast, { text: message, onDone: () => setMessage("") })
        );
      }

      function InboxPanel({ items, loadDraft, loading, onBack, onRefresh }) {
        return h(
          "section",
          { style: { display: "grid", gap: 12 } },
          h(
            "header",
            {
              style: {
                alignItems: "center",
                display: "flex",
                gap: 8,
                justifyContent: "space-between"
              }
            },
            h("strong", null, "交接记录"),
            h(
              "div",
              { style: { display: "flex", gap: 6 } },
              h(
                Button,
                {
                  icon: h(IconRefreshOutline16),
                  size: "sm",
                  variant: "toolbar",
                  onClick: onRefresh
                },
                loading ? "刷新中…" : "刷新"
              ),
              h(
                Button,
                {
                  icon: h(IconChevronLeftOutline14),
                  size: "sm",
                  variant: "ghost",
                  onClick: onBack
                },
                "返回"
              )
            )
          ),
          items.length === 0
            ? h(
                "div",
                {
                  style: {
                    border: "1px dashed var(--dsw-alias-border-subtle)",
                    borderRadius: 10,
                    color: "var(--dsw-alias-text-tertiary)",
                    padding: 20,
                    textAlign: "center"
                  }
                },
                loading ? "正在读取…" : "暂无已整理的交接记录。"
              )
            : h(
                "div",
                { style: { display: "grid", gap: 10 } },
                ...items.map((item) =>
                  h(InboxCard, {
                    key: item.handoffId,
                    item,
                    loadDraft
                  })
                )
              )
        );
      }

      function SpecsRelayDeepSeekView({
        loadDraft,
        loadProjectDraft,
        onClose,
        openSession,
        pickProject,
        prepareProject,
        sessionId,
        standalone = false,
        useSessions
      }) {
        const [busy, setBusy] = useState("");
        const [browserState, setBrowserState] = useState("starting");
        const [compactLayout, setCompactLayout] = useState(false);
        const [compactPane, setCompactPane] = useState("web");
        const [sources, setSources] = useState([]);
        const [integratedFingerprint, setIntegratedFingerprint] = useState("");
        const [answers, setAnswers] = useState([]);
        const [executionHistory, setExecutionHistory] = useState([]);
        const [history, setHistory] = useState([]);
        const [loadedStorageKey, setLoadedStorageKey] = useState("");
        const [message, setMessage] = useState("");
        const [messageKind, setMessageKind] = useState("info");
        const [organizerRoute, setOrganizerRoute] = useState({
          provider: "",
          model: ""
        });
        const [panel, setPanel] = useState("workbench");
        const [preparedTarget, setPreparedTarget] = useState(null);
        const [projectPreparing, setProjectPreparing] = useState(false);
        const [summary, setSummary] = useState(null);
        const viewRef = useRef(null);
        const webPanelRef = useRef(null);
        const state = useInbox();
        const currentWorkspace = useSessions(
          (sessions) => sessions.byId[sessionId]?.cwd || ""
        );
        const [projectPath, setProjectPath] = useState(currentWorkspace);
        const storageKey = useMemo(
          () =>
            `${WORKSPACE_STORAGE_PREFIX}${encodeURIComponent(
              currentWorkspace || sessionId || "global"
            )}`,
          [currentWorkspace, sessionId]
        );
        const workspaceState = useMemo(
          () => ({
            version: 3,
            sources,
            integratedFingerprint,
            handoff: summary,
            answers,
            history,
            executionHistory,
            organizerRoute
          }),
          [
            answers,
            executionHistory,
            history,
            integratedFingerprint,
            organizerRoute,
            sources,
            summary
          ]
        );
        const sorted = useMemo(
          () =>
            [...state.items].sort((left, right) =>
              right.receivedAt.localeCompare(left.receivedAt)
            ),
          [state.items]
        );
        const currentFingerprint = sourcesFingerprint(sources);
        const needsIntegration = Boolean(
          (currentFingerprint || summary) &&
            currentFingerprint !== integratedFingerprint
        );
        const currentPrompt = summary ? formatHandoffPrompt(summary) : "";
        const currentExecutionFingerprint =
          projectPath && currentPrompt
            ? stableHash(`${projectPath}\n${currentPrompt}`)
            : "";
        const currentVersionLoaded = Boolean(
          currentExecutionFingerprint &&
            executionHistory.some(
              (item) =>
                item.status === "submitted" &&
                item.fingerprint === currentExecutionFingerprint
            )
        );
        const targetShouldPrepare = Boolean(
          projectPath &&
            summary?.ready_for_execution === true &&
            (!Array.isArray(summary.open_questions) ||
              summary.open_questions.length === 0) &&
            !needsIntegration &&
            !currentVersionLoaded
        );

        useEffect(() => {
          const node = viewRef.current;
          if (!node || typeof ResizeObserver !== "function") return;
          const observer = new ResizeObserver(([entry]) => {
            if (entry) setCompactLayout(entry.contentRect.width < 1040);
          });
          observer.observe(node);
          return () => observer.disconnect();
        }, []);

        useEffect(() => {
          setProjectPath(currentWorkspace);
        }, [currentWorkspace]);

        useEffect(() => {
          let cancelled = false;
          if (!targetShouldPrepare) {
            setPreparedTarget(null);
            setProjectPreparing(false);
            return () => {
              cancelled = true;
            };
          }
          setPreparedTarget(null);
          setProjectPreparing(true);
          void prepareProject(projectPath)
            .then((result) => {
              if (cancelled) return;
              if (!result.ok) throw new Error(result.message);
              setPreparedTarget(result);
            })
            .catch((error) => {
              if (cancelled) return;
              setMessageKind("error");
              setMessage(
                error instanceof Error ? error.message : String(error)
              );
            })
            .finally(() => {
              if (!cancelled) setProjectPreparing(false);
            });
          return () => {
            cancelled = true;
          };
        }, [prepareProject, projectPath, targetShouldPrepare]);

        useEffect(() => {
          let cancelled = false;
          const restore = (value) => {
            const restored = normalizeWorkspace(value);
            setSources(restored.sources);
            setIntegratedFingerprint(restored.integratedFingerprint);
            setSummary(restored.handoff);
            setAnswers(restored.answers);
            setHistory(restored.history);
            setExecutionHistory(restored.executionHistory);
            setOrganizerRoute(restored.organizerRoute);
          };
          let cached = null;
          try {
            cached = JSON.parse(localStorage.getItem(storageKey) || "null");
          } catch {
            // A malformed or unavailable browser cache does not block host restoration.
          }
          restore(cached);
          setPanel("workbench");
          setLoadedStorageKey("");
          void readWorkspaceState(storageKey)
            .then((durable) => {
              if (!cancelled && durable) restore(durable);
            })
            .catch(() => {
              // Browser cache remains the fallback when host persistence is unavailable.
            })
            .finally(() => {
              if (!cancelled) setLoadedStorageKey(storageKey);
            });
          return () => {
            cancelled = true;
          };
        }, [storageKey]);

        useEffect(() => {
          const controller = new AbortController();
          fetch(
            `${API}/organizer/status?sessionId=${encodeURIComponent(sessionId)}`,
            { cache: "no-store", signal: controller.signal }
          )
            .then(async (response) => {
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
              setOrganizerRoute({
                provider: String(data.provider || ""),
                model: String(data.model || "")
              });
            })
            .catch((error) => {
              if (error?.name !== "AbortError") {
                setOrganizerRoute({ provider: "", model: "" });
              }
            });
          return () => controller.abort();
        }, [sessionId]);

        useEffect(() => {
          if (loadedStorageKey !== storageKey) return;
          try {
            localStorage.setItem(storageKey, JSON.stringify(workspaceState));
          } catch {
            // Host persistence remains available when the browser cache is unavailable.
          }
          const timer = window.setTimeout(() => {
            void writeWorkspaceState(storageKey, workspaceState).catch(() => {
              // Browser cache remains the fallback when host persistence fails.
            });
          }, 250);
          return () => window.clearTimeout(timer);
        }, [
          loadedStorageKey,
          storageKey,
          workspaceState
        ]);

        useEffect(() => {
          if (!message || messageKind === "error") return;
          const timer = window.setTimeout(
            () => setMessage(""),
            STATUS_MESSAGE_DURATION_MS
          );
          return () => window.clearTimeout(timer);
        }, [message, messageKind]);

        const startBrowser = async ({ reload = false } = {}) => {
          setBrowserState("starting");
          setMessage("");
          try {
            const response = await fetch(
              `${API}/browser/start${reload ? "?reload=1" : ""}`,
              {
              method: "POST"
              }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
            setBrowserState("ready");
          } catch (error) {
            setBrowserState("error");
            setMessageKind("error");
            setMessage(error instanceof Error ? error.message : String(error));
          }
        };

        useEffect(() => {
          void startBrowser();
        }, []);

        const closeView = () => {
          if (loadedStorageKey === storageKey) {
            void writeWorkspaceState(storageKey, workspaceState).catch(() => {});
          }
          void fetch(`${API}/browser/layout`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ visible: false }),
            keepalive: true
          }).catch(() => {});
          onClose?.();
        };

        useEffect(() => {
          const node = webPanelRef.current;
          if (!node) return;
          let active = true;
          let animationFrame = 0;
          const publish = () => {
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(() => {
              if (!active) return;
              const rect = node.getBoundingClientRect();
              const visible =
                browserState === "ready" &&
                (!compactLayout || compactPane === "web") &&
                rect.width > 0 &&
                rect.height > 0;
              void fetch(`${API}/browser/layout`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  visible,
                  x: Math.max(0, Math.round(rect.x)),
                  y: Math.max(0, Math.round(rect.y)),
                  width: Math.max(0, Math.round(rect.width)),
                  height: Math.max(0, Math.round(rect.height))
                })
              }).then(async (response) => {
                if (response.ok || !active) return;
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${response.status}`);
              }).catch((error) => {
                if (!active) return;
                setBrowserState("error");
                setMessageKind("error");
                setMessage(error instanceof Error ? error.message : String(error));
              });
            });
          };
          const resizeObserver = typeof ResizeObserver === "function"
            ? new ResizeObserver(publish)
            : null;
          resizeObserver?.observe(node);
          window.addEventListener("resize", publish);
          window.addEventListener("scroll", publish, true);
          publish();
          return () => {
            active = false;
            cancelAnimationFrame(animationFrame);
            resizeObserver?.disconnect();
            window.removeEventListener("resize", publish);
            window.removeEventListener("scroll", publish, true);
            void fetch(`${API}/browser/layout`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ visible: false }),
              keepalive: true
            }).catch(() => {});
          };
        }, [browserState, compactLayout, compactPane]);

        const organizeSources = async (kind, sourceItems, extra = {}) => {
          if (sourceItems.length === 0) return;
          const fingerprint = sourcesFingerprint(sourceItems);
          setBusy(kind);
          setMessage("");
          try {
            const response = await fetch(`${API}/organize`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                sessionId,
                text: formatSourcesTranscript(sourceItems),
                ...extra
              }),
              signal: AbortSignal.timeout(190000)
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || `HTTP ${response.status}`);
            }
            setSummary(data.handoff);
            setOrganizerRoute({
              provider: String(data.provider || ""),
              model: String(data.model || "")
            });
            setAnswers(
              Array.isArray(data.handoff?.open_questions)
                ? data.handoff.open_questions.map(() => "")
                : []
            );
            setIntegratedFingerprint(fingerprint);
            setPanel("workbench");
            setMessageKind("success");
            setMessage(
              data.requiresClarification
                ? "需求分析 Skill 已完成强化，但仍有需要你确认的产品决定。"
                : `已使用 ${data.skill?.name || "SpecsRelay 需求分析 Skill"}，并由 DSH 的 ${data.provider} · ${data.model} 完成需求整理。`
            );
          } catch (error) {
            setMessageKind("error");
            setMessage(error instanceof Error ? error.message : String(error));
          } finally {
            setBusy("");
          }
        };

        const organize = (kind, extra = {}) =>
          organizeSources(kind, sources, extra);

        const captureCurrentConversation = async () => {
          if (browserState !== "ready" || busy) return;
          setBusy("capture");
          setMessage("");
          try {
            const response = await fetch(`${API}/browser/capture`, {
              method: "POST"
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
            const capture = data.item;
            const nextSources = addCapturedRequirementSource(capture);
            setSources(nextSources);
            setPanel("workbench");
            setMessageKind("info");
            setMessage(
              `已抓取当前完整对话（${capture.messageCount} 条消息），正在自动整理需求…`
            );
            await organizeSources("integrate", nextSources);
          } catch (error) {
            setMessageKind("error");
            setMessage(error instanceof Error ? error.message : String(error));
          } finally {
            setBusy("");
          }
        };

        const clarify = () =>
          organize("clarify", {
            previousHandoff: summary,
            clarifications: (summary?.open_questions || []).map(
              (question, index) => ({ question, answer: answers[index] || "" })
            )
          });

        const newRequirement = () => {
          const snapshot = workspaceSnapshot(
            sources,
            integratedFingerprint,
            summary,
            answers
          );
          const archived = snapshotHasContent(snapshot);
          if (archived) {
            setHistory((items) => [snapshot, ...items].slice(0, MAX_WORKSPACE_HISTORY));
          }
          setSources([]);
          setIntegratedFingerprint("");
          setSummary(null);
          setAnswers([]);
          setPanel("workbench");
          setMessageKind("success");
          setMessage(
            archived
              ? "当前需求已移除，并已保存到本地恢复记录。"
              : "当前没有可移除的需求。"
          );
        };

        const restoreHistory = (index) => {
          const selected = history[index];
          if (!selected) return;
          const current = workspaceSnapshot(
            sources,
            integratedFingerprint,
            summary,
            answers
          );
          const remaining = history.filter((_, itemIndex) => itemIndex !== index);
          setHistory(
            snapshotHasContent(current)
              ? [current, ...remaining].slice(0, MAX_WORKSPACE_HISTORY)
              : remaining
          );
          setSources(normalizeSources(selected.sources));
          setIntegratedFingerprint(selected.integratedFingerprint || "");
          setSummary(selected.handoff || null);
          setAnswers(Array.isArray(selected.answers) ? selected.answers : []);
          setPanel("workbench");
          setMessageKind("success");
          setMessage("已恢复所选需求工作区。");
        };

        const openInbox = () => {
          setPanel("inbox");
          void inbox.refresh();
        };

        const selectProject = async () => {
          const selected = await pickProject();
          if (selected) {
            setPreparedTarget(null);
            setProjectPath(selected);
          }
          return selected;
        };

        const loadCurrentVersion = async (prompt) => {
          if (!summary) {
            return { ok: false, message: "当前还没有可载入的结构化需求。" };
          }
          const handoffStartedAt = performance.now();
          const prepared =
            preparedTarget &&
            normalizedPath(preparedTarget.projectPath) ===
              normalizedPath(projectPath)
              ? preparedTarget
              : null;
          const result = await loadProjectDraft({
            handoffId: `dsh-live-${Date.now()}`,
            objective: summary.objective,
            preparedProjectPath: prepared?.projectPath,
            preparedSessionId: prepared?.sessionId,
            projectPath,
            prompt,
            receivedAt: new Date().toISOString(),
            sourceProvider: "DeepSeek",
            state: "received",
            submit: true,
            title: summary.title
          });
          if (result.ok) {
            console.info("[SpecsRelay] DSH handoff timing", {
              clickToSubmitMs: performance.now() - handoffStartedAt,
              localSubmitMs: result.submitLatencyMs
            });
            const loadedProjectPath = result.projectPath || projectPath;
            const snapshot = createExecutionSnapshot(
              summary,
              loadedProjectPath,
              prompt,
              sources
            );
            const nextExecutionHistory = normalizeExecutionHistory([
              snapshot,
              ...executionHistory.filter(
                (item) => item.fingerprint !== snapshot.fingerprint
              )
            ]);
            setProjectPath(loadedProjectPath);
            setExecutionHistory(nextExecutionHistory);
            const targetStorageKey = `${WORKSPACE_STORAGE_PREFIX}${encodeURIComponent(
              loadedProjectPath || result.sessionId || "global"
            )}`;
            const loadedWorkspaceState = {
              ...workspaceState,
              executionHistory: nextExecutionHistory
            };
            try {
              localStorage.setItem(
                targetStorageKey,
                JSON.stringify(loadedWorkspaceState)
              );
            } catch {
              // Host persistence remains available when the browser cache is unavailable.
            }
            void writeWorkspaceState(
              targetStorageKey,
              loadedWorkspaceState
            ).catch(() => {});
            openSession(result.sessionId);
            closeView();
          }
          return result;
        };

        const reloadExecutionSnapshot = (snapshot) =>
          loadDraft({
            handoffId: `dsh-snapshot-${snapshot.id}`,
            objective: snapshot.handoff.objective,
            projectPath: snapshot.projectPath,
            prompt: snapshot.prompt,
            receivedAt: snapshot.createdAt,
            sourceProvider: "DeepSeek",
            state: "loaded",
            title: snapshot.handoff.title
          });

        const reviseFromSnapshot = (snapshot, revisionInstruction) => {
          const snapshotSources = snapshot.sources.length
            ? snapshot.sources
            : sources;
          setSources(snapshotSources);
          setSummary(snapshot.handoff);
          setIntegratedFingerprint(sourcesFingerprint(snapshotSources));
          setPanel("workbench");
          void organizeSources("revision", snapshotSources, {
            previousHandoff: snapshot.handoff,
            revisionInstruction
          });
        };

        return h(
          "section",
          {
            "aria-label": "SpecsRelay DeepSeek 网页",
            ref: viewRef,
            style: {
              color: "var(--dsw-alias-text-primary)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              height: standalone ? "100vh" : "calc(100vh - 190px)",
              minHeight: 520,
              minWidth: 0,
              padding: standalone ? 16 : "0 16px 16px"
            }
          },
          h(
            "header",
            {
              style: {
                alignItems: "center",
                display: "flex",
                gap: 8,
                justifyContent: "space-between"
              }
            },
            h(
              "div",
              { style: { minWidth: 0 } },
              h("strong", null, "DeepSeek 网页"),
              h(
                "div",
                {
                  title: currentWorkspace,
                  style: {
                    color: "var(--dsw-alias-text-tertiary)",
                    fontSize: 12,
                    marginTop: 3,
                    maxWidth: "min(62vw, 720px)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }
                },
                currentWorkspace
                  ? `当前 DSH 项目：${currentWorkspace}`
                  : "当前 DSH 会话尚未关联项目"
              )
            ),
          compactLayout &&
            h(
              "div",
              {
                role: "tablist",
                "aria-label": "DeepSeek 与 SpecsRelay",
                style: { display: "flex", gap: 6 }
              },
              h(
                Pill,
                {
                  active: compactPane === "web",
                  role: "tab",
                  "aria-selected": compactPane === "web",
                  onClick: () => setCompactPane("web")
                },
                "DeepSeek 网页"
              ),
              h(
                Pill,
                {
                  active: compactPane === "relay",
                  role: "tab",
                  "aria-selected": compactPane === "relay",
                  onClick: () => setCompactPane("relay")
                },
                "SpecsRelay"
              )
            ),
          h(
            "div",
              { style: { display: "flex", gap: 8 } },
              h(
                Button,
                {
                  icon: h(IconRefreshOutline16),
                  size: "sm",
                  variant: "toolbar",
                  onClick: () => void startBrowser({ reload: true })
                },
                "刷新网页"
              ),
              onClose &&
                h(
                  Button,
                  {
                    icon: h(IconCloseOutline16),
                    size: "sm",
                    variant: "ghost",
                    onClick: closeView
                  },
                  "关闭"
                )
            )
          ),
          h(
            "div",
            {
              style: {
                display: "grid",
                flex: "1 1 auto",
                gap: 10,
                gridTemplateColumns: compactLayout
                  ? "minmax(0, 1fr)"
                  : "minmax(0, 1fr) minmax(440px, 510px)",
                minHeight: 0
              }
            },
            h(
              "div",
              {
                ref: webPanelRef,
                style: {
                  border: "1px solid var(--dsw-alias-border-subtle)",
                  borderRadius: 12,
                  display: compactLayout && compactPane !== "web" ? "none" : "block",
                  minHeight: 0,
                  overflow: "hidden"
                }
              },
              h(
                "div",
                {
                  style: {
                    alignItems: "center",
                    background: "#101114",
                    color: "var(--dsw-alias-text-tertiary)",
                    display: "flex",
                    height: "100%",
                    justifyContent: "center",
                    minHeight: 500,
                    width: "100%"
                  }
                },
                browserState === "error" ? "请使用支持 SpecsRelay 的 DSH 桌面客户端" : "正在准备 DeepSeek…"
              )
            ),
            h(
              "aside",
              {
                "aria-label": "SpecsRelay 常驻侧栏",
                style: {
                  background: "var(--dsw-alias-bg-layer-1)",
                  border: "1px solid var(--dsw-alias-border-subtle)",
                  borderRadius: 12,
                  display: compactLayout && compactPane !== "relay" ? "none" : "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  overflow: "hidden"
                }
              },
              h(
                "header",
                {
                  style: {
                    alignItems: "center",
                    borderBottom: "1px solid var(--dsw-alias-border-subtle)",
                    display: "flex",
                    gap: 10,
                    padding: "12px 14px"
                  }
                },
                h("img", {
                  src: SPECSRELAY_ICON,
                  alt: "",
                  "aria-hidden": true,
                  draggable: false,
                  style: { borderRadius: 6, height: 26, width: 26 }
                }),
                h(
                  "div",
                  null,
                  h("strong", null, "SpecsRelay"),
                  h(
                    "div",
                    {
                      style: {
                        color: "var(--dsw-alias-text-tertiary)",
                        fontSize: 11,
                        marginTop: 2
                      }
                    },
                    "DeepSeek → DSH 需求交接"
                  )
                ),
                h(
                  "div",
                  { style: { display: "flex", gap: 6, marginLeft: "auto" } },
                  h(Pill, { active: true }, "DSH 模型"),
                  h(
                    Button,
                    {
                      icon: h(IconArchiveOutline20, { size: 16 }),
                      size: "sm",
                      variant: "ghost",
                      onClick: openInbox
                    },
                    "记录"
                  )
                )
              ),
              h(
                "div",
                {
                  style: {
                    alignContent: "start",
                    display: "grid",
                    flex: "1 1 auto",
                    gap: 12,
                    gridAutoRows: "max-content",
                    overflow: "auto",
                    padding: 14
                  }
                },
                panel === "inbox"
                  ? h(InboxPanel, {
                      items: sorted,
                      loadDraft,
                      loading: state.loading,
                      onBack: () => setPanel("workbench"),
                      onRefresh: () => void inbox.refresh()
                    })
                  : h(
                      React.Fragment,
                      null,
                      browserState !== "ready" &&
                        h(
                          "div",
                          {
                            role: browserState === "error" ? "alert" : "status",
                            style: {
                              alignItems: "center",
                              background: "color-mix(in srgb, var(--dsw-alias-state-warning-primary, #f4b740) 10%, var(--dsw-alias-bg-layer-2))",
                              border: "1px solid var(--dsw-alias-state-warning-primary, #f4b740)",
                              borderRadius: 9,
                              display: "flex",
                              gap: 8,
                              minHeight: 38,
                              padding: "0 10px"
                            }
                          },
                          h(StateDot, { state: "warning" }),
                          h(
                            "span",
                            { style: { flex: 1, fontSize: 12 } },
                            browserState === "error"
                              ? "暂时无法打开 DeepSeek，请重试。"
                              : "正在准备 DeepSeek…"
                          ),
                          browserState === "error" &&
                            h(Button, { size: "sm", variant: "ghost", onClick: () => void startBrowser({ reload: true }) }, "重试")
                        ),
                      h(
                        "div",
                        {
                          style: {
                            alignItems: "center",
                            background: "color-mix(in srgb, var(--dsw-alias-brand-primary, #35d39a) 8%, var(--dsw-alias-bg-layer-2))",
                            border: "1px solid var(--dsw-alias-brand-primary, #35d39a)",
                            borderRadius: 9,
                            display: "flex",
                            gap: 8,
                            minHeight: 38,
                            padding: "0 10px"
                          }
                        },
                        h(StateDot, { state: organizerRoute.model ? "done" : "warning" }),
                        h(
                          "strong",
                          { style: { fontSize: 12, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
                          organizerRoute.model
                            ? `需求模型：DeepSeek · ${organizerRoute.model}`
                            : "正在读取 DSH 当前需求模型"
                        ),
                        h(Pill, { active: true, style: { marginLeft: "auto" } }, "DSH 提供")
                      ),
                      message &&
                        h(
                          "div",
                          {
                            role: messageKind === "error" ? "alert" : "status",
                            style: {
                              alignItems: "flex-start",
                              background:
                                messageKind === "error"
                                  ? "color-mix(in srgb, var(--dsw-alias-state-error-primary, #ed5f74) 10%, var(--dsw-alias-bg-layer-2))"
                                  : "color-mix(in srgb, var(--dsw-alias-brand-primary, #35d39a) 10%, var(--dsw-alias-bg-layer-2))",
                              border: `1px solid ${
                                messageKind === "error"
                                  ? "var(--dsw-alias-state-error-primary, #ed5f74)"
                                  : "var(--dsw-alias-brand-primary, #35d39a)"
                              }`,
                              borderRadius: 9,
                              boxSizing: "border-box",
                              color:
                                messageKind === "error"
                                  ? "var(--dsw-alias-state-error-primary, #ed5f74)"
                                  : "var(--dsw-alias-text-secondary)",
                              display: "flex",
                              gap: 8,
                              maxWidth: "100%",
                              minWidth: 0,
                              minHeight: 42,
                              padding: 10,
                              position: "static"
                            }
                          },
                          messageKind === "error"
                            ? h(IconWarningOutline16)
                            : h(StateDot, { state: "done" }),
                          h(
                            "strong",
                            {
                              style: {
                                flex: 1,
                                fontSize: 12,
                                lineHeight: 1.5,
                                overflowWrap: "anywhere"
                              }
                            },
                            message
                          ),
                          h(
                            Button,
                            {
                              "aria-label": "关闭提示",
                              icon: h(IconCloseOutline16),
                              size: "sm",
                              variant: "ghost",
                              onClick: () => setMessage("")
                            }
                          )
                        ),
                      h(
                        WorkflowStep,
                        {
                          number: 1,
                          title: "建立并强化当前需求",
                          description: "获取当前 DeepSeek 对话后，SpecsRelay 会自动整理并强化为可交接需求。"
                        },
                        (sources.length > 0 || summary) &&
                          h(
                            "div",
                            { style: { display: "flex", justifyContent: "flex-end" } },
                            h(
                              Button,
                              {
                                icon: h(IconTrashOutline16),
                                size: "sm",
                                variant: "ghost",
                                onClick: newRequirement
                              },
                              "移除需求"
                            )
                          ),
                        h(
                          Button,
                          {
                            disabled: browserState !== "ready" || Boolean(busy),
                            icon: h(IconEnhanceOutline16),
                            variant: "primary",
                            onClick: () => void captureCurrentConversation()
                          },
                          busy === "capture"
                            ? "正在抓取完整对话…"
                            : busy === "integrate"
                              ? "正在自动整理需求…"
                            : sources.length
                              ? "重新整理当前对话"
                              : "整理当前对话"
                        ),
                      ),
                      h(
                        RequirementCheckStep,
                        { handoff: summary },
                        summary &&
                          h(HandoffSummaryPanel, {
                            answers,
                            busy,
                            handoff: summary,
                            onAnswer: (index, value) =>
                              setAnswers((items) => {
                                const next = [...items];
                                next[index] = value;
                                return next;
                              }),
                            onClarify: () => void clarify()
                          })
                      ),
                      h(DeliveryStep, {
                        alreadyLoaded: currentVersionLoaded,
                        busy,
                        handoff: summary,
                        onLoad: loadCurrentVersion,
                        onSelectProject: selectProject,
                        projectPath,
                        projectPreparing,
                        sourcesChanged: needsIntegration
                      }),
                      h(ExecutionSnapshotPanel, {
                        busy,
                        history: executionHistory,
                        onReload: reloadExecutionSnapshot,
                        onRevise: reviseFromSnapshot
                      })
                    ),
                state.error && panel === "inbox" &&
                  h(
                    "div",
                    {
                      role: "alert",
                      style: {
                        color: "var(--dsw-alias-state-error-primary)",
                        fontSize: 12
                      }
                    },
                    `无法读取交接记录：${state.error}`
                  ),
              )
            )
          ),
          h(
            "p",
            {
              style: {
                color: "var(--dsw-alias-text-tertiary)",
                fontSize: 12,
                margin: 0
              }
            },
            "DeepSeek 登录和对话抓取均在此工作区完成。"
          )
        );
      }

      function SpecsRelayShortcut({
        dshDesktop,
        wide,
        loadDraft,
        loadProjectDraft,
        openSession,
        pickProject,
        prepareProject,
        useSessions
      }) {
        const [open, setOpen] = useState(false);
        const sessionId = useSessions((sessions) => sessions.current || "");
        const onClick = () => setOpen(true);
        return h(
          React.Fragment,
          null,
          h(
            Button,
            {
              icon: h("img", {
                src: SPECSRELAY_ICON,
                alt: "",
                "aria-hidden": true,
                draggable: false,
                style: {
                  borderRadius: 5,
                  display: "block",
                  height: 22,
                  width: 22
                }
              }),
              onClick,
              title: "打开 SpecsRelay",
              "aria-label": "打开 SpecsRelay",
              variant: "ghost",
              style: {
                alignSelf: dshDesktop ? "flex-end" : undefined,
                borderRadius: wide ? 12 : "50%",
                boxSizing: "border-box",
                flex: "none",
                fontSize: 14,
                gap: wide ? 8 : 0,
                height: wide ? 34 : 36,
                justifyContent: wide ? "flex-start" : "center",
                lineHeight: "22px",
                margin: wide ? "4px -4px 4px" : "8px 0 10px",
                overflow: "hidden",
                padding: wide ? "6px 2px 6px 10px" : 0,
                width: wide ? "calc(100% + 8px)" : 36
              }
            },
            wide && h("span", null, "SpecsRelay")
          ),
          open &&
            h(
              "div",
              {
                "aria-label": "DeepSeek 网页入口",
                style: {
                  background: "var(--dsw-alias-bg-base)",
                  inset: 0,
                  position: "fixed",
                  zIndex: 1000
                }
              },
              h(SpecsRelayDeepSeekView, {
                loadDraft,
                loadProjectDraft,
                onClose: () => setOpen(false),
                openSession,
                pickProject,
                prepareProject,
                sessionId,
                standalone: true,
                useSessions
              })
            )
        );
      }

      function SpecsRelayQuickLoad({ loadLatest }) {
        const [status, setStatus] = useState("DeepSeek Relay");
        const onClick = async () => {
          setStatus("读取中…");
          try {
            const item = await inbox.latest();
            if (!item) {
              setStatus("暂无新需求");
              return;
            }
            const result = loadLatest(item);
            if (!result.ok) {
              setStatus("请先切换项目");
              return;
            }
            try {
              await inbox.receipt(item, result.sessionId);
              setStatus("已载入，请检查");
            } catch {
              setStatus("已载入，回执失败");
            }
          } catch {
            setStatus("读取失败");
          }
        };
        return h(
          Button,
          {
            icon: h(IconSendOutline14),
            onClick,
            size: "sm",
            title: "载入最近的 SpecsRelay for DeepSeek 需求",
            variant: "toolbar"
          },
          status
        );
      }

      const inject = ["slots", "sessions", "conversation", "workspaces"];

      function apply(ctx) {
        const locationParams = new URLSearchParams(window.location.search);
        const dshDesktopMode = locationParams.get("dsh-desktop-mode");
        const dshDesktopPlatform = locationParams.get("dsh-desktop-platform");
        const isDshDesktop = ["compatibility", "advanced"].includes(
          dshDesktopMode
        ) && ["darwin", "win32", "linux"].includes(dshDesktopPlatform);
        const loadCurrent = (item) => {
          const sessionId = ctx.sessions.list.getSnapshot().current;
          if (!sessionId) {
            return {
              ok: false,
              message: "请先在 DSH 中选择项目并创建会话。"
            };
          }
          return loadIntoSession(ctx, sessionId, item);
        };
        const loadProject = (item) => loadIntoProject(ctx, item);
        const openSession = (sessionId) => ctx.sessions.open(sessionId);
        const pickProject = () => {
          const desktopPicker = window.dshDesktopDirectoryPicker;
          return desktopPicker && typeof desktopPicker.pick === "function"
            ? desktopPicker.pick()
            : ctx.workspaces.pickDirectory();
        };
        const prepareProject = (projectPath) =>
          prepareProjectTarget(ctx, projectPath);
        ctx.effect(
          () =>
            ctx.slots.inject("sidebar.footer.action", () =>
              ctx.slots.register(
                {
                  name: "sidebar.footer.action",
                  id: "specsrelay-deepseek",
                  order: -10,
                  inject: () => ({
                    dshDesktop: isDshDesktop,
                    loadDraft: loadCurrent,
                    loadProjectDraft: loadProject,
                    openSession,
                    pickProject,
                    prepareProject
                  })
                },
                SpecsRelayShortcut
              )
            ),
          "specsrelay-deepseek: sidebar shortcut"
        );
        ctx.effect(
          () =>
            ctx.slots.inject("conversation.input.right", () =>
              ctx.slots.register(
                {
                  name: "conversation.input.right",
                  id: "specsrelay-deepseek",
                  order: 40,
                  inject: (sessionId) => ({
                    loadLatest: (item) => loadIntoSession(ctx, sessionId, item)
                  })
                },
                SpecsRelayQuickLoad
              )
            ),
          "specsrelay-deepseek: composer shortcut"
        );
      }

      return { apply, inject };
    }
  });
})();
