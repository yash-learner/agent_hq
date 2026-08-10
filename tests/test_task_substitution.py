"""Per-ticket label-based queue substitution (`hq:qa=<task-id>`).

Covers the pure resolution (`engine.config.resolve_task_substitution`), the
queue-declaration rewrite (`engine.handoff.substitute_queue_targets`), and the
ledger trail: a substituted entry lands in the queue under the substituted
task id and its handoff.accepted event detail records the reroute. The
`agent-qa` taskdef is a stub dict here -- the substitution machinery must not
depend on tasks/agent-qa/ existing on disk.
"""

from pathlib import Path

from test_state import _clone_worktree, _make_origin

from engine.config import Config, load_config, resolve_task_substitution
from engine.engine import apply_queue
from engine.handoff import substitute_queue_targets
from engine.models import Handoff
from engine.state import GitJsonStateStore

REPO_ROOT = Path(__file__).resolve().parent.parent

# Stub registry: `agent-qa` registered directly, never loaded from tasks/.
TASKDEFS = {
    "qa": {"id": "qa", "version": 1, "budget": {"max_cost_usd": 10.0}},
    "agent-qa": {"id": "agent-qa", "version": 1, "budget": {"max_cost_usd": 10.0}},
    "finalize": {"id": "finalize", "version": 1, "budget": {"max_cost_usd": 5.0}},
}


def _config(label_overrides=("hq:executor=", "hq:qa=")):
    return Config(
        components={"label_overrides": list(label_overrides)},
        repos={},
        projects={},
        approvers={},
        budgets={"loop_guard": {"max_runs": 25}, "ticket_cap_usd": 1000.0},
    )


def _qa_handoff(**over):
    kwargs = {"key": "qa-1", "target_task": "qa", "reason": "review passed"}
    kwargs.update(over)
    return Handoff(**kwargs)


# -- resolve_task_substitution: the pure label lookup -----------------------


def test_allowlisted_label_substitutes_the_task_id():
    resolved = resolve_task_substitution(_config(), ["bug", "hq:qa=agent-qa"], "qa")
    assert resolved == "agent-qa"


def test_no_label_returns_the_task_id_unchanged():
    assert resolve_task_substitution(_config(), ["bug"], "qa") == "qa"


def test_label_without_allowlist_entry_is_ignored():
    """Same gating as resolve_binding: a label whose prefix is not in
    label_overrides has no effect, however plausible it looks."""
    config = _config(label_overrides=("hq:executor=",))
    assert resolve_task_substitution(config, ["hq:qa=agent-qa"], "qa") == "qa"


def test_label_for_a_different_task_does_not_apply():
    """hq:qa= only matches queue entries whose task id is `qa`."""
    assert resolve_task_substitution(_config(), ["hq:qa=agent-qa"], "finalize") == "finalize"


def test_shipped_components_config_allowlists_the_qa_prefix():
    """Pins the config/components.yml deliverable: the substitution is inert
    unless the deployment allowlists the prefix, and ours does."""
    config = load_config(REPO_ROOT / "config", REPO_ROOT / "schemas")
    assert "hq:qa=" in config.components["label_overrides"]


# -- substitute_queue_targets: the queue-declaration rewrite ----------------


def test_qa_entry_is_rewritten_to_agent_qa():
    out, reason = substitute_queue_targets(
        [_qa_handoff()],
        config=_config(),
        taskdefs=TASKDEFS,
        ticket_labels=["hq:qa=agent-qa"],
    )
    assert reason is None
    assert [h.target_task for h in out] == ["agent-qa"]
    # The reroute is written into the reason, which is what the
    # handoff.proposed/accepted events emit as their detail.
    assert "task 'qa' substituted with 'agent-qa' via ticket label" in out[0].reason


def test_without_the_label_entries_pass_through_untouched():
    original = [_qa_handoff()]
    out, reason = substitute_queue_targets(
        original, config=_config(), taskdefs=TASKDEFS, ticket_labels=[]
    )
    assert reason is None
    # Identity, not just equality: no-label behavior is byte-identical.
    assert out[0] is original[0]


def test_label_present_but_prefix_not_allowlisted_is_a_noop():
    original = [_qa_handoff()]
    out, reason = substitute_queue_targets(
        original,
        config=_config(label_overrides=("hq:executor=",)),
        taskdefs=TASKDEFS,
        ticket_labels=["hq:qa=agent-qa"],
    )
    assert reason is None
    assert out[0] is original[0]


def test_bogus_substitution_value_rejects_as_unknown_task():
    """The allowlist gates only the prefix, so the value must re-validate
    against loaded taskdefs -- the entry passed validate_queue under its
    declared name, not the substituted one."""
    out, reason = substitute_queue_targets(
        [_qa_handoff()],
        config=_config(),
        taskdefs=TASKDEFS,
        ticket_labels=["hq:qa=nope"],
    )
    assert out == []
    assert "not a known task" in reason
    assert "'nope'" in reason


def test_non_qa_entries_are_never_substituted():
    out, reason = substitute_queue_targets(
        [
            _qa_handoff(),
            Handoff(key="fin-1", target_task="finalize", reason="wrap up"),
        ],
        config=_config(),
        taskdefs=TASKDEFS,
        ticket_labels=["hq:qa=agent-qa"],
    )
    assert reason is None
    assert [h.target_task for h in out] == ["agent-qa", "finalize"]
    assert "substituted" not in out[1].reason


# -- through apply_queue: the substituted entry lands in state --------------


def _store(tmp_path: Path) -> GitJsonStateStore:
    origin = _make_origin(tmp_path)
    return GitJsonStateStore(_clone_worktree(tmp_path, origin, "wt"))


def test_substituted_entry_is_queued_and_event_detail_records_the_reroute(tmp_path):
    store = _store(tmp_path)
    config = _config()
    source_run = {
        "run_id": "src", "task_id": "review", "ticket_id": "ticket-1", "chain_depth": 0,
        "bindings": {}, "state": "RUNNING", "task_version": 1, "attempt": 0,
        "cost_usd": None, "tokens": None, "usage_known": False, "artifacts": [],
    }
    store.write(lambda txn: (
        txn.set_ticket("ticket-1", status="ACTIVE", pinned_comment_id=None),
        txn.put_run("ticket-1", source_run),
    ))

    accepted, reason = substitute_queue_targets(
        [_qa_handoff()],
        config=config,
        taskdefs=TASKDEFS,
        ticket_labels=["hq:qa=agent-qa"],
    )
    assert reason is None

    result = {}

    def try_apply(txn):
        applied, apply_reason = apply_queue(
            txn, config, TASKDEFS, "ticket-1", source_run, accepted
        )
        result["applied"], result["reason"] = applied, apply_reason

    store.write(try_apply)
    assert result["reason"] is None
    assert len(result["applied"]) == 1

    # The queued run carries the SUBSTITUTED task id, not the declared one.
    runs = {r["run_id"]: r for r in store.read_state("ticket-1")["runs"]}
    assert runs[result["applied"][0]]["task_id"] == "agent-qa"

    # And the ledger says so: the handoff.accepted detail is the entry's
    # reason, which now carries the substitution note.
    accepted_events = [
        e for e in store.read_events("ticket-1") if e["kind"] == "handoff.accepted"
    ]
    assert len(accepted_events) == 1
    assert (
        "task 'qa' substituted with 'agent-qa' via ticket label"
        in accepted_events[0]["detail"]
    )
