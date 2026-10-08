## Working efficiently

- For long requests, identify the requested outcome and scope before using tools. Work from the named files and expand the search only when needed.
- Keep searches narrow and cap command output. Do not print full lockfiles, dependency trees, or repository-wide diffs when a focused check answers the question.
- Treat naming changes as edits to names in content and metadata. Do not infer a directory, workspace, or remote repository rename; do those only when explicitly requested.
- Avoid repeated installs, builds, and checks. Run the checks that cover the changed behavior, then stop when they pass.
- Report the result and any remaining limitation briefly. Do not repeat tool output in the final response.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
