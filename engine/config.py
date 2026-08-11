"""Config registry loader (§6).

Reads the six YAML registries (components, repos, projects, approvers,
budgets, mcp-servers), schema-validates each, and resolves per-port adapter
bindings.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

from engine.qa_report import validate_qa_media_combo

REGISTRIES = ("components", "repos", "projects", "approvers", "budgets", "mcp-servers")


class ConfigError(Exception):
    """Raised with every schema violation found across all registry files."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("\n".join(errors))


@dataclass(frozen=True)
class Config:
    components: dict
    repos: dict
    projects: dict
    approvers: dict
    budgets: dict
    # Defaulted so the many hand-built Configs in tests stay valid; the loader
    # always supplies it (mcp-servers.yml is required like every registry).
    mcp_servers: dict = field(default_factory=dict)


def load_config(config_dir: str | Path, schemas_dir: str | Path) -> Config:
    config_dir = Path(config_dir)
    schemas_dir = Path(schemas_dir)

    errors: list[str] = []
    loaded: dict[str, dict] = {}
    for name in REGISTRIES:
        yml_path = config_dir / f"{name}.yml"
        schema = json.loads((schemas_dir / f"{name}.schema.json").read_text())
        try:
            instance = yaml.safe_load(yml_path.read_text()) or {}
        except FileNotFoundError:
            errors.append(f"{yml_path.name}: <root>: file is missing")
            continue
        except yaml.YAMLError as exc:
            errors.append(f"{yml_path.name}: <root>: YAML parse error: {exc}")
            continue
        validator = Draft202012Validator(schema)
        for error in validator.iter_errors(instance):
            json_path = "/".join(str(p) for p in error.path) or "<root>"
            errors.append(f"{yml_path.name}: {json_path}: {error.message}")
        # File names use dashes (mcp-servers.yml); dataclass fields cannot.
        loaded[name.replace("-", "_")] = instance

    # Media-policy defaults apply when keys are omitted; reject a combo that
    # leaves every evidence mode off (schema alone cannot see defaults).
    for repo, meta in (loaded.get("repos") or {}).items():
        reason = validate_qa_media_combo(repo, meta if isinstance(meta, dict) else None)
        if reason:
            errors.append(reason)

    if errors:
        raise ConfigError(errors)
    return Config(**loaded)


def resolve_binding(
    config: Config,
    port: str,
    task_binding_name: str | None,
    ticket_labels: list[str],
) -> str:
    """Resolve the concrete adapter name for a port.

    Precedence: (1) an allowlisted `hq:<port>=<adapter>` ticket label, else
    (2) for the gate port, a non-"default" logical binding name resolved
    through components.gate.named, else (3) the port's configured adapter.
    """
    if port not in config.components:
        raise ConfigError([f"components.yml: no binding configured for port '{port}'"])
    binding = config.components[port]
    label_prefix = f"hq:{port}="
    # ponytail: allowlist gates only the port, not the adapter value; Task 7's
    # registry rejects unknown adapter names, which backstops a bogus label.
    if label_prefix in config.components.get("label_overrides", []):
        for label in ticket_labels:
            if label.startswith(label_prefix):
                return label[len(label_prefix) :]

    if port == "gate" and task_binding_name not in (None, "default"):
        named = binding.get("named", {})
        if task_binding_name in named:
            return named[task_binding_name]

    return binding["adapter"]


def resolve_task_substitution(config: Config, ticket_labels: list[str], task_id: str) -> str:
    """Resolve a per-ticket queued-task substitution for `task_id`.

    Mirror of `resolve_binding`'s label override, for queue entries instead of
    ports: an allowlisted `hq:<task-id>=<other-task-id>` ticket label swaps a
    queued task (e.g. `hq:qa=agent-qa` reroutes QA to the MCP-driven agent-qa
    task) without any prompt change -- review keeps queueing `qa`. Like the
    port override, the allowlist gates only the PREFIX, not the value; the
    caller must check the substituted id against the loaded taskdefs, which
    backstops a bogus label. Returns `task_id` unchanged when the prefix is
    not allowlisted or no matching label is present.
    """
    label_prefix = f"hq:{task_id}="
    if label_prefix not in config.components.get("label_overrides", []):
        return task_id
    for label in ticket_labels:
        if label.startswith(label_prefix):
            return label[len(label_prefix) :]
    return task_id


def validate_task_bindings(taskdefs: dict, config: Config) -> list[str]:
    """Reject a task-declared `components` port with no configured binding,
    a task-declared `mcp` server with no catalog entry, and a
    `projects.initial_task` that doesn't resolve to a loaded task.

    A task's `components` map (port -> logical binding name) only makes
    sense for a port components.yml actually configures. A task that
    declares no `components` (e.g. qa) stays registered-but-unwired.
    Same shape for `mcp`: names are only meaningful against the
    mcp-servers.yml catalog, and a typo should fail `tasks validate`, not a
    live run at prepare time.
    """
    errors: list[str] = []
    for task_id, taskdef in taskdefs.items():
        for port in taskdef.get("components", {}):
            if port not in config.components:
                errors.append(
                    f"{task_id}: components.{port}: no binding configured in components.yml"
                )
        for server in taskdef.get("mcp", []):
            if server not in config.mcp_servers:
                errors.append(f"{task_id}: mcp: no server named '{server}' in mcp-servers.yml")
    initial_task = config.projects.get("initial_task")
    if initial_task not in taskdefs:
        errors.append(f"projects.yml: initial_task: '{initial_task}' is not a loaded task")
    return errors


def resolve_mcp_servers(config: Config, taskdef: dict) -> dict:
    """The catalog entries for a task's declared `mcp` server names, keyed by
    name -- what the executor adapter writes into the run worktree's
    `.mcp.json`. Empty for a task with no `mcp` field. An unknown name raises
    rather than silently dropping the server: `validate_task_bindings` should
    have caught it, but prepare must not hand the agent a session quietly
    missing a capability its prompt assumes."""
    servers = {}
    for name in taskdef.get("mcp", []):
        if name not in config.mcp_servers:
            raise ConfigError(
                [f"{taskdef.get('id')}: mcp: no server named '{name}' in mcp-servers.yml"]
            )
        servers[name] = config.mcp_servers[name]
    return servers
