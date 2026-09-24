export const HANDOFF_VERSION = "1.0";

export const HANDOFF_PROMPT = `Prepare a structured handoff for a separate local coding agent using the ENTIRE conversation above, including every clarification, correction, and decision.

Do not ask another question in prose. Return exactly one JSON object and no Markdown fence.
Do not invent repository paths, filenames, APIs, or implementation facts that were not established.
Before writing the JSON, silently choose the smallest applicable coverage level. This level is internal reasoning only and must not be added to the JSON:
- LITE: a localized bug, copy change, or small behavior change with clear scope.
- STANDARD: a feature, prototype, workflow, integration, or change spanning multiple behaviors.
- STRICT: authentication, payments, permissions, sensitive data, destructive actions, migrations, public APIs, deployment, or another high-impact/irreversible change.

Apply only the relevant coverage checks:
- Always check the objective, user-visible scope, decisions, non-goals, observable acceptance criteria, and verification.
- For STANDARD, also check the main user flow, important error/empty/loading states, data handling, compatibility, and dependencies that were actually discussed.
- For STRICT, also check applicable security, privacy, authorization, performance, accessibility, localization, migration, observability, rollout, and rollback concerns.
- Fold applicable quality concerns into constraints, acceptance_criteria, verification_steps, or implementation_plan. Do not invent requirements merely to fill a checklist.
- Within this same response, select only the methods the content needs: prerequisite-aware clarification for material ambiguity, acceptance coverage for confirmed behavior, reconciliation for explicit corrections or a supplied related handoff, and a proportionate final review. Do not expose method selection or add workflow stages.
- Connect each confirmed in-scope behavior to observable acceptance and verification using matching behavior names in the existing arrays. Do not invent numeric targets, commands, or a new tracking schema.
- Revisions must preserve unaffected supported requirements and remove withdrawn behavior from all affected fields, including dependent tasks and questions. A previous handoff is not proof of user approval or completed implementation. Return the complete current handoff, not a diff.

Question policy:
- Put at most 3 concise questions in open_questions.
- Resolve answered or withdrawn choices before asking. Ask only questions whose prerequisite user decisions are settled; after each answer, reconsider dependent questions and discard those made irrelevant. Never assume a dependent answer just to mark the handoff ready.
- Ask only for a user-owned product decision that materially changes scope, visible behavior, cost, privacy, risk, or an irreversible choice.
- Never ask the user for repository facts, file locations, framework conventions, test commands, or technical details the local Coding Agent can inspect. Put those in local_context_needed.
- Do not ask about a low-impact ambiguity when the local Coding Agent can safely follow existing repository conventions; add the convention check to local_context_needed or implementation_plan instead.
- When useful, include 2-3 short mutually exclusive options inside the question so a non-technical user can answer quickly.
- If blocking user decisions remain, set ready_for_execution to false. Otherwise set open_questions to [] and ready_for_execution to true.
execution_mode must be "plan".

Use this exact shape:
{
  "schema_version": "1.0",
  "title": "short task title",
  "objective": "precise outcome",
  "context": "why this is needed and relevant background",
  "implementation_plan": ["ordered implementation guidance"],
  "acceptance_criteria": ["observable pass condition"],
  "verification_steps": ["test or inspection that proves acceptance"],
  "constraints": ["hard constraint"],
  "non_goals": ["explicitly out of scope"],
  "decisions": ["decision already made"],
  "open_questions": [],
  "local_context_needed": ["fact the coding agent must inspect locally"],
  "risk_level": "low",
  "execution_mode": "plan",
  "ready_for_execution": true,
  "source": {
    "provider": "name of this chatbot",
    "model": "model used to clarify the requirement, if known",
    "conversation_title": "optional title"
  }
}

risk_level must be one of "low", "medium", or "high". Keep the handoff compact: include decisions and evidence needed for execution, not the full conversation transcript.`;

export function buildHandoffRepairPrompt(errors) {
  const issues = errors.map((error) => `- ${error}`).join("\n");
  return `Your previous handoff could not be parsed or failed the handoff schema.

Correct only the formatting and schema problems listed below. Preserve the decisions and meaning from the full conversation. Do not invent answers to unresolved questions.

Validation problems:
${issues}

Return exactly one corrected JSON object with no Markdown fence and no additional prose.`;
}

const REQUIRED_STRING_FIELDS = ["title", "objective", "context"];
const REQUIRED_LIST_FIELDS = [
  "implementation_plan",
  "acceptance_criteria",
  "verification_steps",
  "constraints",
  "non_goals",
  "decisions",
  "open_questions",
  "local_context_needed"
];
const ALLOWED_FIELDS = new Set([
  "schema_version",
  ...REQUIRED_STRING_FIELDS,
  ...REQUIRED_LIST_FIELDS,
  "risk_level",
  "execution_mode",
  "ready_for_execution",
  "source"
]);

export function stripJsonFence(value) {
  const trimmed = String(value ?? "").trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

export function parseHandoff(value) {
  const text = stripJsonFence(value);
  if (!text) {
    return {
      handoff: null,
      errors: ["Paste or select a handoff JSON object first."],
      warnings: []
    };
  }

  try {
    const parsed = JSON.parse(text);
    const validation = validateHandoffObject(parsed);
    return { handoff: parsed, ...validation };
  } catch (error) {
    return {
      handoff: null,
      errors: [`Invalid JSON: ${error.message}`],
      warnings: []
    };
  }
}

function findBalancedJsonObjects(text) {
  const candidates = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
    } else if (character === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        candidates.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }
  return candidates;
}

export function parseHandoffResponse(value) {
  const text = String(value ?? "").trim();
  const candidates = [];
  const fencedPattern = /```(?:json)?\s*([\s\S]*?)\s*```/gi;

  for (const match of text.matchAll(fencedPattern)) {
    candidates.push(match[1].trim());
  }
  candidates.push(...findBalancedJsonObjects(text));
  candidates.push(stripJsonFence(text));

  const seen = new Set();
  let firstParsedResult = null;
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    try {
      const handoff = JSON.parse(candidate);
      const validation = validateHandoffObject(handoff);
      const result = { handoff, ...validation };
      if (validation.errors.length === 0) {
        return result;
      }
      firstParsedResult ??= result;
    } catch {
      // Try the next extracted JSON candidate.
    }
  }

  return firstParsedResult ?? parseHandoff(text);
}

export function isRepairableHandoffError(message) {
  return ![
    "Resolve open_questions before execution.",
    "ready_for_execution must be true."
  ].includes(message);
}

export function validateHandoffObject(value) {
  const errors = [];
  const warnings = [];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      errors: ["The handoff must be a JSON object."],
      warnings
    };
  }

  if (value.schema_version !== HANDOFF_VERSION) {
    errors.push(`schema_version must be "${HANDOFF_VERSION}".`);
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof value[field] !== "string" || !value[field].trim()) {
      errors.push(`${field} must be a non-empty string.`);
    }
  }
  if (typeof value.title === "string" && value.title.length > 160) {
    errors.push("title must not exceed 160 characters.");
  }
  if (typeof value.objective === "string" && value.objective.length > 8000) {
    errors.push("objective must not exceed 8000 characters.");
  }
  if (typeof value.context === "string" && value.context.length > 12000) {
    errors.push("context must not exceed 12000 characters.");
  }

  for (const field of REQUIRED_LIST_FIELDS) {
    if (!Array.isArray(value[field])) {
      errors.push(`${field} must be an array.`);
      continue;
    }
    if (value[field].length > 100) {
      errors.push(`${field} must not contain more than 100 items.`);
    }

    if (
      value[field].some(
        (item) => typeof item !== "string" || !item.trim()
      )
    ) {
      errors.push(`${field} may contain only non-empty strings.`);
    }
    if (
      value[field].some(
        (item) => typeof item === "string" && item.length > 4000
      )
    ) {
      errors.push(`${field} items must not exceed 4000 characters.`);
    }
  }

  if (
    Array.isArray(value.acceptance_criteria) &&
    value.acceptance_criteria.length === 0
  ) {
    errors.push("At least one acceptance criterion is required.");
  }

  if (
    Array.isArray(value.verification_steps) &&
    value.verification_steps.length === 0
  ) {
    errors.push("At least one verification step is required.");
  }

  if (
    Array.isArray(value.open_questions) &&
    value.open_questions.length > 0
  ) {
    errors.push("Resolve open_questions before execution.");
  }

  if (!["low", "medium", "high"].includes(value.risk_level)) {
    errors.push('risk_level must be "low", "medium", or "high".');
  }

  if (value.execution_mode !== "plan") {
    errors.push('The MVP only supports execution_mode "plan".');
  }

  if (value.ready_for_execution !== true) {
    errors.push("ready_for_execution must be true.");
  }

  if (
    value.source !== undefined &&
    (!value.source ||
      typeof value.source !== "object" ||
      Array.isArray(value.source))
  ) {
    errors.push("source must be an object when provided.");
  }
  if (value.source && typeof value.source === "object" && !Array.isArray(value.source)) {
    const allowedSourceFields = new Set([
      "provider",
      "model",
      "conversation_title",
      "url"
    ]);
    const unsupportedSourceFields = Object.keys(value.source).filter(
      (field) => !allowedSourceFields.has(field)
    );
    if (unsupportedSourceFields.length > 0) {
      errors.push(
        `Unsupported source fields: ${unsupportedSourceFields.join(", ")}.`
      );
    }
    for (const field of Object.keys(value.source)) {
      if (typeof value.source[field] !== "string") {
        errors.push(`source.${field} must be a string.`);
      }
    }
    const sourceLimits = {
      provider: 80,
      model: 120,
      conversation_title: 200,
      url: 2048
    };
    for (const [field, limit] of Object.entries(sourceLimits)) {
      if (
        typeof value.source[field] === "string" &&
        value.source[field].length > limit
      ) {
        errors.push(`source.${field} must not exceed ${limit} characters.`);
      }
    }
  }

  const unknownFields = Object.keys(value).filter(
    (field) => !ALLOWED_FIELDS.has(field)
  );
  if (unknownFields.length > 0) {
    errors.push(`Unsupported fields: ${unknownFields.join(", ")}.`);
  }

  if (Array.isArray(value.implementation_plan) && value.implementation_plan.length === 0) {
    warnings.push("implementation_plan is empty; the local agent will plan from the objective.");
  }
  if (Array.isArray(value.constraints) && value.constraints.length === 0) {
    warnings.push("No constraints were declared.");
  }
  if (Array.isArray(value.non_goals) && value.non_goals.length === 0) {
    warnings.push("No non-goals were declared.");
  }
  if (value.risk_level === "high") {
    warnings.push("This is a high-risk task. Keep execution read-only until independently reviewed.");
  }

  return { errors, warnings };
}

export function formatHandoff(value) {
  return JSON.stringify(value, null, 2);
}
