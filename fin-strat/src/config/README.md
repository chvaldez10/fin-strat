# Config

This folder contains typed configuration used by routes and layout components.

## Use This Folder For

- Site metadata and brand labels.
- Public navigation.
- Dashboard navigation.
- Workspace/demo shell configuration.

## Rules

- Keep route labels and hrefs centralized here when they are shared by layouts.
- Prefer typed config objects over hardcoded strings in components.
- Do not put runtime secrets or environment validation here.
- Do not put large feature data here; create a feature boundary when needed.
