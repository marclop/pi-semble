import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";

const params = Type.Object({
  action: Type.Union([Type.Literal("search"), Type.Literal("find_related")], {
    description: "Which Semble action to run.",
  }),
  query: Type.Optional(Type.String({ description: "Natural language or code query." })),
  file_path: Type.Optional(Type.String({ description: "Path as shown in Semble search results." })),
  line: Type.Optional(Type.Integer({ minimum: 1, description: "1-indexed line number." })),
  repo: Type.Optional(
    Type.String({ description: "Local directory path or git URL to search. Defaults to the current project directory." }),
  ),
  top_k: Type.Optional(Type.Integer({ minimum: 1, description: "Number of results to return." })),
  include_text_files: Type.Optional(Type.Boolean({ description: "Also index non-code text files." })),
});

type ToolInput =
  | {
      action: "search";
      query: string;
      repo?: string;
      top_k?: number;
      include_text_files?: boolean;
    }
  | {
      action: "find_related";
      file_path: string;
      line: number;
      repo?: string;
      top_k?: number;
      include_text_files?: boolean;
    };

async function runSemble(pi: ExtensionAPI, args: string[], signal: AbortSignal | undefined) {
  try {
    return await pi.exec("uvx", ["--from", "semble[mcp]", "semble", ...args], { signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      stdout: "",
      stderr: message,
      code: 127,
      killed: false,
    };
  }
}

function formatFailure(hint: string, stdout: string, stderr: string, code: number | undefined) {
  const parts = [hint];
  const out = stdout.trim();
  const err = stderr.trim();
  if (out) parts.push("\n\nstdout:\n" + out);
  if (err) parts.push("\n\nstderr:\n" + err);
  if (typeof code === "number") parts.push(`\n\nexit code: ${code}`);
  parts.push(
    "\n\nTip: install uv from https://docs.astral.sh/uv/getting-started/installation/ or set a custom runner by wrapping this extension.",
  );
  return parts.join("");
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "semble",
    label: "Semble",
    description: "Fast code search for repositories, with semantic and related-code lookup.",
    promptSnippet: "Prefer Semble first; use grep/find only as fallback for exhaustive literal searches or when Semble is insufficient.",
    promptGuidelines: [
      "Use semble first whenever the user is trying to locate relevant code, understand an implementation, or find similar snippets.",
      "Prefer action=search for general questions; use find-related for adjacent code.",
      "Use action=find_related after a useful search result if you need adjacent or similar implementations.",
      "Use grep or find only when Semble does not answer the request well enough, or when the user needs exhaustive literal/path-based matching.",
    ],
    parameters: params,
    async execute(_toolCallId, input: ToolInput, signal) {
      const repo = input.repo?.trim() || ".";
      const includeText = input.include_text_files ? ["--content", "all"] : [];
      const topK = String(input.top_k ?? 5);

      if (input.action === "search" && !input.query) {
        return {
          content: [{ type: "text", text: "Missing required field: query" }],
          details: { error: true },
          isError: true,
        };
      }

      if (input.action === "find_related" && (!input.file_path || typeof input.line !== "number")) {
        return {
          content: [{ type: "text", text: "Missing required fields: file_path and line" }],
          details: { error: true },
          isError: true,
        };
      }

      const result =
        input.action === "search"
          ? await runSemble(
              pi,
              ["search", input.query, repo, "-k", topK, ...includeText],
              signal,
            )
          : await runSemble(
              pi,
              ["find-related", input.file_path, String(input.line), repo, "-k", topK, ...includeText],
              signal,
            );

      if (result.code !== 0) {
        return {
          content: [
            {
              type: "text",
              text: formatFailure("Semble execution failed.", result.stdout, result.stderr, result.code),
            },
          ],
          details: {
            exitCode: result.code,
            stdout: result.stdout,
            stderr: result.stderr,
          },
          isError: true,
        };
      }

      const output = (result.stdout || result.stderr || "").trim() || "No results.";
      return {
        content: [{ type: "text", text: output }],
        details: {
          repo,
          action: input.action,
          raw: output,
        },
      };
    },
  });
}
