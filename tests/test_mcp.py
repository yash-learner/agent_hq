"""MCP capability: taskdef `mcp` field, the config/mcp-servers.yml catalog,
and the copilot-cli adapter's project-level `.mcp.json` injection.

The flow under test: task.yml declares `mcp: [name, ...]` -> names validated
against the catalog at `tasks validate` (`validate_task_bindings`) -> prepare
resolves the entries into the run bundle (`resolve_mcp_servers`) -> the
executor adapter writes `{"mcpServers": {...}}` to `.mcp.json` in the run
worktree before spawning -> the work patch excludes the file. No `mcp` means
no file and no behavior change for every existing task.
"""

from __future__ import annotations

import json
import subprocess
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
import yaml

from engine.adapters import claude_code_headless as cch
from engine.adapters import copilot_cli as cc
from engine.adapters.copilot_cli import CopilotCli
from engine.config import (
    Config,
    ConfigError,
    load_config,
    resolve_mcp_servers,
    validate_task_bindings,
)
from engine.taskdefs import TaskDefError, load_all, load_task

REPO_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = REPO_ROOT / "config"
SCHEMAS_DIR = REPO_ROOT / "schemas"
TASKS_DIR = REPO_ROOT / "tasks"

FUTURE_DEADLINE = (datetime.now(UTC) + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")

PLAYWRIGHT_ENTRY = {
    "type": "local",
    "command": "npx",
    "args": ["-y", "@playwright/mcp@latest", "--headless"],
    "tools": ["*"],
}


def _config(mcp_servers: dict | None = None) -> Config:
    return Config(
        components={"executor": {"adapter": "copilot-cli"}, "label_overrides": []},
        repos={},
        projects={"initial_task": "sample"},
        approvers={},
        budgets={},
        mcp_servers=mcp_servers or {},
    )


def _write_task(task_dir: Path, taskdef: dict) -> None:
    task_dir.mkdir(parents=True, exist_ok=True)
    (task_dir / "task.yml").write_text(yaml.safe_dump(taskdef))


def _minimal_taskdef(task_id: str = "sample", **overrides) -> dict:
    base = {
        "id": task_id,
        "version": 1,
        "description": "A test task.",
        "trigger": "enqueued_by",
        "budget": {"max_cost_usd": 5, "max_runtime_min": 30, "retries": 2},
    }
    base.update(overrides)
    return base


# -- schema: taskdef `mcp` field ------------------------------------------------


def test_taskdef_with_mcp_loads(tmp_path):
    _write_task(tmp_path / "with-mcp", _minimal_taskdef("with-mcp", mcp=["playwright"]))

    loaded = load_task(tmp_path / "with-mcp", SCHEMAS_DIR)

    assert loaded["mcp"] == ["playwright"]


def test_taskdef_mcp_must_be_string_names(tmp_path):
    """`mcp` is a list of catalog names, not inline server definitions -- the
    entry itself lives in config/mcp-servers.yml."""
    _write_task(tmp_path / "bad", _minimal_taskdef("bad", mcp=[{"command": "npx"}]))

    with pytest.raises(TaskDefError) as excinfo:
        load_task(tmp_path / "bad", SCHEMAS_DIR)

    assert any("mcp" in e for e in excinfo.value.errors)


# -- validation: names must exist in the catalog --------------------------------


def test_validate_task_bindings_rejects_unknown_mcp_server():
    config = _config(mcp_servers={"playwright": PLAYWRIGHT_ENTRY})
    taskdefs = {"sample": {"id": "sample", "mcp": ["playwrong"]}}

    errors = validate_task_bindings(taskdefs, config)

    assert any("playwrong" in e and "mcp-servers.yml" in e for e in errors)


def test_validate_task_bindings_accepts_catalogued_mcp_server():
    config = _config(mcp_servers={"playwright": PLAYWRIGHT_ENTRY})
    taskdefs = {"sample": {"id": "sample", "mcp": ["playwright"]}}

    assert validate_task_bindings(taskdefs, config) == []


def test_validate_task_bindings_ignores_task_without_mcp():
    config = _config()
    taskdefs = {"sample": {"id": "sample"}}

    assert validate_task_bindings(taskdefs, config) == []


# -- resolution: what prepare puts in the bundle ---------------------------------


def test_resolve_mcp_servers_returns_catalog_entries_keyed_by_name():
    config = _config(mcp_servers={"playwright": PLAYWRIGHT_ENTRY})

    servers = resolve_mcp_servers(config, {"id": "agent-qa", "mcp": ["playwright"]})

    assert servers == {"playwright": PLAYWRIGHT_ENTRY}


def test_resolve_mcp_servers_empty_for_task_without_mcp():
    config = _config(mcp_servers={"playwright": PLAYWRIGHT_ENTRY})

    assert resolve_mcp_servers(config, {"id": "qa"}) == {}


def test_resolve_mcp_servers_raises_on_unknown_name():
    """Validation should have caught it, but prepare must not hand the agent
    a session quietly missing a capability its prompt assumes."""
    config = _config()

    with pytest.raises(ConfigError, match="playwright"):
        resolve_mcp_servers(config, {"id": "agent-qa", "mcp": ["playwright"]})


# -- adapter: .mcp.json injection -------------------------------------------------


class FakeProc:
    def __init__(self):
        self.returncode = 0

    def communicate(self, input=None, timeout=None):
        return "", ""

    def kill(self):
        pass


def _install_fake_popen(monkeypatch):
    calls = []

    def fake_popen(argv, **kwargs):
        calls.append({"argv": argv, **kwargs})
        return FakeProc()

    monkeypatch.setattr(cc.subprocess, "Popen", fake_popen)
    return calls


def test_run_writes_mcp_json_when_bundle_carries_servers(monkeypatch, tmp_path):
    _install_fake_popen(monkeypatch)
    executor = CopilotCli({})

    executor.run(
        {
            "prompt": "hi",
            "worktree": str(tmp_path),
            "mcp_servers": {"playwright": PLAYWRIGHT_ENTRY},
        },
        [],
        FUTURE_DEADLINE,
    )

    written = json.loads((tmp_path / ".mcp.json").read_text())
    assert written == {"mcpServers": {"playwright": PLAYWRIGHT_ENTRY}}


def test_run_writes_no_mcp_json_without_servers(monkeypatch, tmp_path):
    """No `mcp` -> no file -> Copilot CLI loads no project-level servers;
    behavior for every existing task is unchanged."""
    _install_fake_popen(monkeypatch)
    executor = CopilotCli({})

    executor.run({"prompt": "hi", "worktree": str(tmp_path)}, [], FUTURE_DEADLINE)

    assert not (tmp_path / ".mcp.json").exists()


def test_run_allows_mcp_server_by_name_when_tools_allowlist_present(monkeypatch, tmp_path):
    """`--allow-all-tools` (the no-allowlist branch) already covers MCP tools;
    an explicit `tools` allowlist would silence them, so each declared server
    is additionally --allow-tool'd by name."""
    calls = _install_fake_popen(monkeypatch)
    executor = CopilotCli({})

    executor.run(
        {
            "prompt": "hi",
            "worktree": str(tmp_path),
            "mcp_servers": {"playwright": PLAYWRIGHT_ENTRY},
        },
        ["Read", "Bash"],
        FUTURE_DEADLINE,
    )

    argv = calls[0]["argv"]
    assert "--allow-all-tools" not in argv
    assert "--allow-tool=playwright" in argv


def test_run_without_tools_allowlist_keeps_allow_all_and_no_server_flag(monkeypatch, tmp_path):
    calls = _install_fake_popen(monkeypatch)
    executor = CopilotCli({})

    executor.run(
        {
            "prompt": "hi",
            "worktree": str(tmp_path),
            "mcp_servers": {"playwright": PLAYWRIGHT_ENTRY},
        },
        [],
        FUTURE_DEADLINE,
    )

    argv = calls[0]["argv"]
    assert "--allow-all-tools" in argv
    assert "--allow-tool=playwright" not in argv


def test_run_forces_workspace_mcp_load_in_prompt_mode(monkeypatch, tmp_path):
    """Fresh GHA worktrees are untrusted; Copilot `-p` silently skips
    workspace `.mcp.json` unless we opt in (env) and/or pass the file
    explicitly (`--additional-mcp-config`). Ticket 56 agent-qa hit this."""
    calls = _install_fake_popen(monkeypatch)
    executor = CopilotCli({})

    executor.run(
        {
            "prompt": "hi",
            "worktree": str(tmp_path),
            "mcp_servers": {"playwright": PLAYWRIGHT_ENTRY},
        },
        [],
        FUTURE_DEADLINE,
    )

    argv = calls[0]["argv"]
    env = calls[0]["env"]
    assert "--additional-mcp-config" in argv
    assert argv[argv.index("--additional-mcp-config") + 1] == "@./.mcp.json"
    assert env.get("GITHUB_COPILOT_PROMPT_MODE_WORKSPACE_MCP") == "true"


def test_run_without_mcp_does_not_force_workspace_mcp_load(monkeypatch, tmp_path):
    calls = _install_fake_popen(monkeypatch)
    executor = CopilotCli({})

    executor.run({"prompt": "hi", "worktree": str(tmp_path)}, [], FUTURE_DEADLINE)

    argv = calls[0]["argv"]
    env = calls[0]["env"]
    assert "--additional-mcp-config" not in argv
    assert "GITHUB_COPILOT_PROMPT_MODE_WORKSPACE_MCP" not in env


# -- work patch: .mcp.json never reaches the target repo -------------------------


def _git(*args: str, cwd: Path | None = None) -> str:
    result = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=False)
    assert result.returncode == 0, result.stderr
    return result.stdout


def _make_origin(tmp_path: Path) -> Path:
    origin = tmp_path / "origin.git"
    _git("init", "--bare", "--initial-branch", "main", str(origin))
    seed = tmp_path / "_seed"
    _git("clone", str(origin), str(seed))
    _git("config", "user.email", "seed@example.com", cwd=seed)
    _git("config", "user.name", "Seed", cwd=seed)
    (seed / "existing.txt").write_text("base\n")
    _git("add", "-A", cwd=seed)
    _git("commit", "-m", "base", cwd=seed)
    _git("push", "-u", "origin", "main", cwd=seed)
    return origin


def test_materialize_work_patch_excludes_mcp_json(monkeypatch, tmp_path):
    """A future writes_code MCP task must not leak the adapter-written session
    config into a PR -- excluded like `.agent-hq`, not left to `writes_code:
    false` discarding the whole patch."""
    origin = _make_origin(tmp_path)
    base_commit = _git("rev-parse", "main", cwd=tmp_path / "_seed").strip()
    monkeypatch.setattr(cch, "_clone_url", lambda repo: str(origin))

    executor = CopilotCli({"workdir": str(tmp_path / "work")})
    worktree = executor.prepare_worktree("run-1", "o/r", base_commit)

    (worktree / "code.py").write_text("print('hi')\n")
    (worktree / ".mcp.json").write_text(json.dumps({"mcpServers": {}}))

    patch = executor.materialize_work_patch(worktree, [])

    assert "code.py" in patch
    assert ".mcp.json" not in patch


# -- pilot config + task library --------------------------------------------------


def test_pilot_mcp_catalog_loads_with_playwright_entry():
    config = load_config(CONFIG_DIR, SCHEMAS_DIR)

    entry = config.mcp_servers["playwright"]
    assert entry["type"] == "local"
    assert entry["command"] == "npx"
    # -y so npx never prompts in the headless child; --headless because the
    # child has no display; devtools caps expose the video tools agent-qa
    # depends on.
    assert entry["args"][0] == "-y"
    assert "--headless" in entry["args"]
    assert "--caps=devtools" in entry["args"]
    assert entry["tools"] == ["*"]


def test_agent_qa_task_loads_with_the_whole_library_and_validates():
    taskdefs = load_all(TASKS_DIR, SCHEMAS_DIR)
    config = load_config(CONFIG_DIR, SCHEMAS_DIR)

    agent_qa = taskdefs["agent-qa"]
    assert agent_qa["mcp"] == ["playwright"]
    assert agent_qa["writes_code"] is False
    # Same collector contract as qa: identical declared outputs.
    assert agent_qa["outputs"] == taskdefs["qa"]["outputs"]
    assert validate_task_bindings(taskdefs, config) == []


def test_repos_yml_anchor_shares_qa_setup_with_agent_qa():
    """The &qa-setup/*qa-setup anchor must survive yaml.safe_load: agent-qa
    runs in exactly the environment qa does, and the notes tell the agent the
    MCP server is there."""
    config = load_config(CONFIG_DIR, SCHEMAS_DIR)

    setup = config.repos["yash-learner/care_fe_agent_hq"]["setup"]
    assert setup["agent-qa"] == setup["qa"]
    # The shared setup-notes heredoc tells the agent the MCP server is there.
    assert "MCP" in setup["agent-qa"]
    assert "browser_start_video" in setup["agent-qa"]
