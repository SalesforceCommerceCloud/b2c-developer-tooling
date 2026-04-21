"""Shared utilities for skill trigger evaluation.

Based on the skill-creator eval harness.
"""

import html as html_mod
import json
import os
import select
import subprocess
import time
import uuid
from pathlib import Path


def find_project_root() -> Path:
    """Find the project root by walking up from cwd looking for .claude/."""
    current = Path.cwd()
    for parent in [current, *current.parents]:
        if (parent / ".claude").is_dir():
            return parent
    return current


def find_eval_project() -> Path:
    """Return the path to the isolated eval project.

    The eval project is a minimal B2C Commerce storefront with all real
    skills copied into .claude/skills/.  Skills are tested with their
    real names, descriptions, and content — and all skills are present
    simultaneously so inter-skill competition is captured.
    """
    eval_dir = Path(__file__).resolve().parent
    project_dir = eval_dir / "project"
    if project_dir.is_dir() and (project_dir / ".claude").is_dir():
        _ensure_git_repo(project_dir)
        _sync_skills(eval_dir, project_dir)
        return project_dir
    return find_project_root()


def _ensure_git_repo(project_dir: Path) -> None:
    """Initialize a git repo in the eval project if one doesn't exist.

    The eval project needs its own .git so claude -p doesn't walk up
    and find the main repo's CLAUDE.md and .claude-plugin config.
    The .git is not committed to the outer repo — it's created at runtime.
    """
    if not (project_dir / ".git").is_dir():
        subprocess.run(
            ["git", "init"],
            cwd=project_dir, capture_output=True,
        )
        subprocess.run(
            ["git", "add", "-A"],
            cwd=project_dir, capture_output=True,
        )
        subprocess.run(
            ["git", "commit", "-m", "eval project"],
            cwd=project_dir, capture_output=True,
        )


def _sync_skills(eval_dir: Path, project_dir: Path) -> None:
    """Copy real skill directories into the eval project's .claude/skills/.

    Copies each skill's SKILL.md and references/ directory (if present)
    into .claude/skills/<skill-name>/, which is the standard location
    for project-level skills.  Skips evals/ directories since those are
    not part of the distributed skill.
    """
    import shutil

    repo_root = eval_dir.parent.parent  # skills/eval/ -> repo root
    target_root = project_dir / ".claude" / "skills"
    target_root.mkdir(parents=True, exist_ok=True)

    # Discover all skill directories that have a SKILL.md
    for plugin_dir in ("b2c", "b2c-cli", "b2c-experimental"):
        skills_parent = repo_root / "skills" / plugin_dir / "skills"
        if not skills_parent.is_dir():
            continue
        for skill_dir in skills_parent.iterdir():
            if not (skill_dir / "SKILL.md").is_dir() and (skill_dir / "SKILL.md").exists():
                dest = target_root / skill_dir.name
                # Re-copy if SKILL.md is newer than the copy
                dest_skill = dest / "SKILL.md"
                if dest_skill.exists() and dest_skill.stat().st_mtime >= (skill_dir / "SKILL.md").stat().st_mtime:
                    continue
                # Clean and copy
                if dest.exists():
                    shutil.rmtree(dest)
                dest.mkdir(parents=True, exist_ok=True)
                shutil.copy2(skill_dir / "SKILL.md", dest / "SKILL.md")
                # Copy references/ if present
                refs = skill_dir / "references"
                if refs.is_dir():
                    shutil.copytree(refs, dest / "references")


def parse_skill_md(skill_path: Path) -> tuple[str, str, str]:
    """Parse a SKILL.md file, returning (name, description, full_content)."""
    content = (skill_path / "SKILL.md").read_text()
    lines = content.split("\n")

    if lines[0].strip() != "---":
        raise ValueError("SKILL.md missing frontmatter (no opening ---)")

    end_idx = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_idx = i
            break

    if end_idx is None:
        raise ValueError("SKILL.md missing frontmatter (no closing ---)")

    name = ""
    description = ""
    frontmatter_lines = lines[1:end_idx]
    i = 0
    while i < len(frontmatter_lines):
        line = frontmatter_lines[i]
        if line.startswith("name:"):
            name = line[len("name:"):].strip().strip('"').strip("'")
        elif line.startswith("description:"):
            value = line[len("description:"):].strip()
            if value in (">", "|", ">-", "|-"):
                continuation_lines: list[str] = []
                i += 1
                while i < len(frontmatter_lines) and (frontmatter_lines[i].startswith("  ") or frontmatter_lines[i].startswith("\t")):
                    continuation_lines.append(frontmatter_lines[i].strip())
                    i += 1
                description = " ".join(continuation_lines)
                continue
            else:
                description = value.strip('"').strip("'")
        i += 1

    return name, description, content


def _skill_matches(value: str, skill_name: str) -> bool:
    """Check if a Skill tool input or Read file path references this skill.

    Matches the bare skill name (e.g. 'b2c-metadata') or any namespaced
    variant (e.g. 'b2c:b2c-metadata', 'b2c-cli:b2c-logs').
    """
    # Exact match or namespace:name match
    if value == skill_name:
        return True
    if value.endswith(f":{skill_name}"):
        return True
    # Substring in a file path (for Read tool detection)
    if f"/{skill_name}/" in value or f"/{skill_name}." in value:
        return True
    return False


def run_single_query(
    query: str,
    skill_name: str,
    skill_description: str,
    timeout: int,
    project_root: str,
    model: str | None = None,
) -> bool:
    """Run a single query and return whether the skill was triggered.

    All skills are pre-installed in the eval project's .claude/skills/
    directory.  Runs `claude -p` with the raw query and detects whether
    Claude invokes the Skill tool (or reads the SKILL.md) for the
    skill under test.
    """
    cmd = [
        "claude",
        "-p", query,
        "--output-format", "stream-json",
        "--verbose",
        "--include-partial-messages",
    ]
    if model:
        cmd.extend(["--model", model])

    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        cwd=project_root,
        env=env,
    )

    start_time = time.time()
    buffer = ""
    pending_tool_name = None
    accumulated_json = ""
    triggered = False

    try:
        while time.time() - start_time < timeout:
            if process.poll() is not None:
                remaining = process.stdout.read()
                if remaining:
                    buffer += remaining.decode("utf-8", errors="replace")
                break

            ready, _, _ = select.select([process.stdout], [], [], 1.0)
            if not ready:
                continue

            chunk = os.read(process.stdout.fileno(), 8192)
            if not chunk:
                break
            buffer += chunk.decode("utf-8", errors="replace")

            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                line = line.strip()
                if not line:
                    continue

                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if event.get("type") == "stream_event":
                    se = event.get("event", {})
                    se_type = se.get("type", "")

                    if se_type == "content_block_start":
                        cb = se.get("content_block", {})
                        if cb.get("type") == "tool_use":
                            tool_name = cb.get("name", "")
                            if tool_name in ("Skill", "Read"):
                                pending_tool_name = tool_name
                                accumulated_json = ""
                            else:
                                return False

                    elif se_type == "content_block_delta" and pending_tool_name:
                        delta = se.get("delta", {})
                        if delta.get("type") == "input_json_delta":
                            accumulated_json += delta.get("partial_json", "")
                            # Early exit: check partial JSON for skill name
                            if f'"{skill_name}"' in accumulated_json:
                                return True
                            if f":{skill_name}" in accumulated_json:
                                return True

                    elif se_type in ("content_block_stop", "message_stop"):
                        if pending_tool_name:
                            # Parse the completed JSON to check properly
                            try:
                                tool_input = json.loads(accumulated_json)
                            except json.JSONDecodeError:
                                tool_input = {}
                            if pending_tool_name == "Skill":
                                return _skill_matches(tool_input.get("skill", ""), skill_name)
                            elif pending_tool_name == "Read":
                                return _skill_matches(tool_input.get("file_path", ""), skill_name)
                            return False
                        if se_type == "message_stop":
                            return False

                elif event.get("type") == "assistant":
                    message = event.get("message", {})
                    for content_item in message.get("content", []):
                        if content_item.get("type") != "tool_use":
                            continue
                        tool_name = content_item.get("name", "")
                        tool_input = content_item.get("input", {})
                        if tool_name == "Skill":
                            if _skill_matches(tool_input.get("skill", ""), skill_name):
                                triggered = True
                        elif tool_name == "Read":
                            if _skill_matches(tool_input.get("file_path", ""), skill_name):
                                triggered = True
                        return triggered

                elif event.get("type") == "result":
                    return triggered
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()

    return triggered


def run_eval(
    eval_set: list[dict],
    skill_name: str,
    description: str,
    num_workers: int,
    timeout: int,
    project_root: Path,
    runs_per_query: int = 1,
    trigger_threshold: float = 0.5,
    model: str | None = None,
) -> dict:
    """Run the full eval set and return results."""
    from concurrent.futures import ProcessPoolExecutor, as_completed

    results = []

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        future_to_info = {}
        for item in eval_set:
            for run_idx in range(runs_per_query):
                future = executor.submit(
                    run_single_query,
                    item["query"],
                    skill_name,
                    description,
                    timeout,
                    str(project_root),
                    model,
                )
                future_to_info[future] = (item, run_idx)

        query_triggers: dict[str, list[bool]] = {}
        query_items: dict[str, dict] = {}
        for future in as_completed(future_to_info):
            item, _ = future_to_info[future]
            query = item["query"]
            query_items[query] = item
            if query not in query_triggers:
                query_triggers[query] = []
            try:
                query_triggers[query].append(future.result())
            except Exception as e:
                import sys
                print(f"Warning: query failed: {e}", file=sys.stderr)
                query_triggers[query].append(False)

    for query, triggers in query_triggers.items():
        item = query_items[query]
        trigger_rate = sum(triggers) / len(triggers)
        should_trigger = item["should_trigger"]
        if should_trigger:
            did_pass = trigger_rate >= trigger_threshold
        else:
            did_pass = trigger_rate < trigger_threshold
        results.append({
            "query": query,
            "should_trigger": should_trigger,
            "trigger_rate": trigger_rate,
            "triggers": sum(triggers),
            "runs": len(triggers),
            "pass": did_pass,
        })

    passed = sum(1 for r in results if r["pass"])
    total = len(results)

    return {
        "skill_name": skill_name,
        "description": description,
        "results": results,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": total - passed,
        },
    }


def generate_html(data: dict, auto_refresh: bool = False, skill_name: str = "") -> str:
    """Generate HTML report from loop output data."""
    history = data.get("history", [])
    title_prefix = html_mod.escape(skill_name + " \u2014 ") if skill_name else ""

    train_queries: list[dict] = []
    test_queries: list[dict] = []
    if history:
        for r in history[0].get("train_results", history[0].get("results", [])):
            train_queries.append({"query": r["query"], "should_trigger": r.get("should_trigger", True)})
        if history[0].get("test_results"):
            for r in history[0].get("test_results", []):
                test_queries.append({"query": r["query"], "should_trigger": r.get("should_trigger", True)})

    refresh_tag = '    <meta http-equiv="refresh" content="5">\n' if auto_refresh else ""

    parts = [f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
{refresh_tag}    <title>{title_prefix}Skill Description Optimization</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 100%; margin: 0 auto; padding: 20px; background: #faf9f5; color: #141413; }}
        h1 {{ color: #141413; }}
        .summary {{ background: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e8e6dc; }}
        .summary p {{ margin: 5px 0; }}
        .best {{ color: #788c5d; font-weight: bold; }}
        .table-container {{ overflow-x: auto; width: 100%; }}
        table {{ border-collapse: collapse; background: white; border: 1px solid #e8e6dc; font-size: 12px; min-width: 100%; }}
        th, td {{ padding: 8px; text-align: left; border: 1px solid #e8e6dc; white-space: normal; word-wrap: break-word; }}
        th {{ background: #141413; color: #faf9f5; font-weight: 500; }}
        th.test-col {{ background: #6a9bcc; }}
        th.query-col {{ min-width: 200px; }}
        td.description {{ font-family: monospace; font-size: 11px; max-width: 400px; }}
        td.result {{ text-align: center; font-size: 16px; min-width: 40px; }}
        td.test-result {{ background: #f0f6fc; }}
        .pass {{ color: #788c5d; }}
        .fail {{ color: #c44; }}
        .rate {{ font-size: 9px; color: #b0aea5; display: block; }}
        tr:hover {{ background: #faf9f5; }}
        .score {{ display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; }}
        .score-good {{ background: #eef2e8; color: #788c5d; }}
        .score-ok {{ background: #fef3c7; color: #d97706; }}
        .score-bad {{ background: #fceaea; color: #c44; }}
        .best-row {{ background: #f5f8f2; }}
        th.positive-col {{ border-bottom: 3px solid #788c5d; }}
        th.negative-col {{ border-bottom: 3px solid #c44; }}
        .legend {{ display: flex; gap: 20px; margin-bottom: 10px; font-size: 13px; align-items: center; }}
        .legend-item {{ display: flex; align-items: center; gap: 6px; }}
        .legend-swatch {{ width: 16px; height: 16px; border-radius: 3px; display: inline-block; }}
        .swatch-positive {{ background: #141413; border-bottom: 3px solid #788c5d; }}
        .swatch-negative {{ background: #141413; border-bottom: 3px solid #c44; }}
        .swatch-test {{ background: #6a9bcc; }}
        .swatch-train {{ background: #141413; }}
    </style>
</head>
<body>
    <h1>{title_prefix}Skill Description Optimization</h1>
"""]

    best_test_score = data.get('best_test_score')
    parts.append(f"""
    <div class="summary">
        <p><strong>Original:</strong> {html_mod.escape(data.get('original_description', 'N/A'))}</p>
        <p class="best"><strong>Best:</strong> {html_mod.escape(data.get('best_description', 'N/A'))}</p>
        <p><strong>Best Score:</strong> {data.get('best_score', 'N/A')} {'(test)' if best_test_score else '(train)'}</p>
        <p><strong>Iterations:</strong> {data.get('iterations_run', 0)} | <strong>Train:</strong> {data.get('train_size', '?')} | <strong>Test:</strong> {data.get('test_size', '?')}</p>
    </div>
""")

    parts.append("""
    <div class="legend">
        <span style="font-weight:600">Query columns:</span>
        <span class="legend-item"><span class="legend-swatch swatch-positive"></span> Should trigger</span>
        <span class="legend-item"><span class="legend-swatch swatch-negative"></span> Should NOT trigger</span>
        <span class="legend-item"><span class="legend-swatch swatch-train"></span> Train</span>
        <span class="legend-item"><span class="legend-swatch swatch-test"></span> Test</span>
    </div>
    <div class="table-container">
    <table>
        <thead><tr>
            <th>Iter</th><th>Train</th><th>Test</th><th class="query-col">Description</th>
""")

    for qinfo in train_queries:
        polarity = "positive-col" if qinfo["should_trigger"] else "negative-col"
        parts.append(f'            <th class="{polarity}">{html_mod.escape(qinfo["query"])}</th>\n')
    for qinfo in test_queries:
        polarity = "positive-col" if qinfo["should_trigger"] else "negative-col"
        parts.append(f'            <th class="test-col {polarity}">{html_mod.escape(qinfo["query"])}</th>\n')

    parts.append("        </tr></thead><tbody>\n")

    if test_queries:
        best_iter = max(history, key=lambda h: h.get("test_passed") or 0).get("iteration")
    elif history:
        best_iter = max(history, key=lambda h: h.get("train_passed", h.get("passed", 0))).get("iteration")
    else:
        best_iter = None

    for h in history:
        iteration = h.get("iteration", "?")
        train_results = h.get("train_results", h.get("results", []))
        test_results_list = h.get("test_results", [])
        description = h.get("description", "")

        train_by_query = {r["query"]: r for r in train_results}
        test_by_query = {r["query"]: r for r in test_results_list} if test_results_list else {}

        def aggregate_runs(results):
            correct = total = 0
            for r in results:
                runs = r.get("runs", 0)
                triggers = r.get("triggers", 0)
                total += runs
                correct += triggers if r.get("should_trigger", True) else (runs - triggers)
            return correct, total

        train_correct, train_runs = aggregate_runs(train_results)
        test_correct, test_runs = aggregate_runs(test_results_list)

        def score_class(correct, total):
            if total > 0:
                ratio = correct / total
                return "score-good" if ratio >= 0.8 else "score-ok" if ratio >= 0.5 else "score-bad"
            return "score-bad"

        row_class = "best-row" if iteration == best_iter else ""
        parts.append(f'        <tr class="{row_class}">')
        parts.append(f'<td>{iteration}</td>')
        parts.append(f'<td><span class="score {score_class(train_correct, train_runs)}">{train_correct}/{train_runs}</span></td>')
        parts.append(f'<td><span class="score {score_class(test_correct, test_runs)}">{test_correct}/{test_runs}</span></td>')
        parts.append(f'<td class="description">{html_mod.escape(description)}</td>')

        for qinfo in train_queries:
            r = train_by_query.get(qinfo["query"], {})
            icon = "\u2713" if r.get("pass", False) else "\u2717"
            css = "pass" if r.get("pass", False) else "fail"
            parts.append(f'<td class="result {css}">{icon}<span class="rate">{r.get("triggers",0)}/{r.get("runs",0)}</span></td>')

        for qinfo in test_queries:
            r = test_by_query.get(qinfo["query"], {})
            icon = "\u2713" if r.get("pass", False) else "\u2717"
            css = "pass" if r.get("pass", False) else "fail"
            parts.append(f'<td class="result test-result {css}">{icon}<span class="rate">{r.get("triggers",0)}/{r.get("runs",0)}</span></td>')

        parts.append("</tr>\n")

    parts.append("    </tbody></table></div>\n</body></html>")
    return "".join(parts)


def generate_eval_report_html(data: dict, previous: dict | None = None) -> str:
    """Generate HTML report for multi-skill eval results from run_eval.py."""
    model = html_mod.escape(data.get("model", "unknown") or "unknown")
    runs_per_query = data.get("runs_per_query", 1)
    total_passed = data.get("total_passed", 0)
    total_queries = data.get("total_queries", 0)
    skills = data.get("skills", [])

    prev_by_skill: dict[str, dict] = {}
    if previous:
        for s in previous.get("skills", []):
            prev_by_skill[s["skill_name"]] = s

    total_ratio = total_passed / total_queries if total_queries else 0
    total_class = "good" if total_ratio >= 0.8 else "ok" if total_ratio >= 0.5 else "bad"

    parts = [f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Skill Trigger Eval Report</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #faf9f5; color: #141413; }}
        h1 {{ color: #141413; margin-bottom: 5px; }}
        .meta {{ color: #b0aea5; margin-bottom: 20px; font-size: 14px; }}
        .summary {{ background: white; padding: 15px 20px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #e8e6dc; display: flex; gap: 30px; align-items: center; }}
        .summary-score {{ font-size: 28px; font-weight: bold; }}
        .summary-score.good {{ color: #788c5d; }}
        .summary-score.ok {{ color: #d97706; }}
        .summary-score.bad {{ color: #c44; }}
        .summary-detail {{ color: #6b6a65; font-size: 14px; }}
        .skill-card {{ background: white; border: 1px solid #e8e6dc; border-radius: 6px; margin-bottom: 12px; overflow: hidden; }}
        .skill-header {{ padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; }}
        .skill-header:hover {{ background: #faf9f5; }}
        .skill-name {{ font-weight: 600; font-size: 15px; }}
        .skill-score {{ font-weight: 600; font-size: 14px; padding: 2px 8px; border-radius: 4px; }}
        .skill-score.good {{ background: #eef2e8; color: #788c5d; }}
        .skill-score.ok {{ background: #fef3c7; color: #d97706; }}
        .skill-score.bad {{ background: #fceaea; color: #c44; }}
        .delta {{ font-size: 12px; margin-left: 8px; }}
        .delta.up {{ color: #788c5d; }}
        .delta.down {{ color: #c44; }}
        .delta.same {{ color: #b0aea5; }}
        .skill-details {{ display: none; border-top: 1px solid #e8e6dc; padding: 0; }}
        .skill-details.open {{ display: block; }}
        .skill-desc {{ padding: 8px 16px; font-size: 13px; color: #6b6a65; background: #faf9f5; border-bottom: 1px solid #e8e6dc; }}
        table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
        th {{ text-align: left; padding: 8px 16px; background: #f5f4f0; color: #6b6a65; font-weight: 500; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }}
        td {{ padding: 8px 16px; border-top: 1px solid #f0eeea; }}
        .pass {{ color: #788c5d; font-weight: 600; }}
        .fail {{ color: #c44; font-weight: 600; }}
        .query-text {{ max-width: 600px; }}
        .trigger-badge {{ display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 11px; font-weight: 500; }}
        .trigger-badge.yes {{ background: #eef2e8; color: #788c5d; }}
        .trigger-badge.no {{ background: #fceaea; color: #c44; }}
        .expand-all {{ background: none; border: 1px solid #e8e6dc; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; color: #6b6a65; }}
        .expand-all:hover {{ background: #f5f4f0; }}
        .toolbar {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }}
        .filter-btns {{ display: flex; gap: 6px; }}
        .filter-btn {{ background: none; border: 1px solid #e8e6dc; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; color: #6b6a65; }}
        .filter-btn:hover, .filter-btn.active {{ background: #141413; color: #faf9f5; border-color: #141413; }}
    </style>
</head>
<body>
    <h1>Skill Trigger Eval Report</h1>
    <div class="meta">Model: {model} &middot; Runs per query: {runs_per_query} &middot; {len(skills)} skills &middot; {total_queries} queries</div>
    <div class="summary">
        <div class="summary-score {total_class}">{total_passed}/{total_queries}</div>
        <div class="summary-detail">queries passed ({total_ratio:.0%})</div>
    </div>
    <div class="toolbar">
        <div class="filter-btns">
            <button class="filter-btn active" onclick="filterSkills('all')">All ({len(skills)})</button>
            <button class="filter-btn" onclick="filterSkills('fail')">Failing ({sum(1 for s in skills if s['summary']['failed'] > 0)})</button>
            <button class="filter-btn" onclick="filterSkills('pass')">Passing ({sum(1 for s in skills if s['summary']['failed'] == 0)})</button>
        </div>
        <button class="expand-all" onclick="toggleAll()">Expand All</button>
    </div>
"""]

    for skill in sorted(skills, key=lambda s: (s["summary"]["failed"] == 0, s["skill_name"])):
        s = skill["summary"]
        ratio = s["passed"] / s["total"] if s["total"] else 0
        sc = "good" if ratio >= 0.8 else "ok" if ratio >= 0.5 else "bad"
        status = "pass" if s["failed"] == 0 else "fail"
        sname = html_mod.escape(skill["skill_name"])
        desc = html_mod.escape(skill.get("description", ""))

        delta_html = ""
        prev = prev_by_skill.get(skill["skill_name"])
        if prev:
            prev_passed = prev["summary"]["passed"]
            diff = s["passed"] - prev_passed
            if diff > 0:
                delta_html = f'<span class="delta up">+{diff}</span>'
            elif diff < 0:
                delta_html = f'<span class="delta down">{diff}</span>'
            else:
                delta_html = '<span class="delta same">=</span>'

        parts.append(f"""
    <div class="skill-card" data-status="{status}">
        <div class="skill-header" onclick="this.nextElementSibling.classList.toggle('open')">
            <span class="skill-name">{sname}</span>
            <span><span class="skill-score {sc}">{s['passed']}/{s['total']}</span>{delta_html}</span>
        </div>
        <div class="skill-details">
            <div class="skill-desc">{desc}</div>
            <table>
                <thead><tr><th>Status</th><th>Expected</th><th>Rate</th><th>Query</th></tr></thead>
                <tbody>""")

        for r in skill.get("results", []):
            pf = "pass" if r["pass"] else "fail"
            icon = "PASS" if r["pass"] else "FAIL"
            expected = "trigger" if r["should_trigger"] else "no-trigger"
            badge_cls = "yes" if r["should_trigger"] else "no"
            query = html_mod.escape(r["query"])
            parts.append(f"""
                <tr><td class="{pf}">{icon}</td><td><span class="trigger-badge {badge_cls}">{expected}</span></td><td>{r['triggers']}/{r['runs']}</td><td class="query-text">{query}</td></tr>""")

        parts.append("""
                </tbody>
            </table>
        </div>
    </div>""")

    parts.append("""
    <script>
    function toggleAll() {
        const details = document.querySelectorAll('.skill-details');
        const allOpen = [...details].every(d => d.classList.contains('open'));
        details.forEach(d => { if (allOpen) d.classList.remove('open'); else d.classList.add('open'); });
        document.querySelector('.expand-all').textContent = allOpen ? 'Expand All' : 'Collapse All';
    }
    function filterSkills(filter) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        document.querySelectorAll('.skill-card').forEach(card => {
            if (filter === 'all') card.style.display = '';
            else card.style.display = card.dataset.status === filter ? '' : 'none';
        });
    }
    </script>
</body></html>""")
    return "".join(parts)
