#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Run trigger evaluation for skill descriptions.

Supports both single-skill and discovery modes:
  - Single skill: --skill-path <path>
  - Discovery:    --discover <dir> [--discover <dir> ...]

Usage:
    # Single skill
    uv run skills/eval/run_eval.py --skill-path skills/b2c-cli/skills/b2c-am --model us.anthropic.claude-sonnet-4-6 --verbose

    # Discover all skills with trigger evals
    uv run skills/eval/run_eval.py --discover skills/ --model us.anthropic.claude-sonnet-4-6 --verbose

Based on the skill-creator eval harness.
"""

import argparse
import json
import sys
import tempfile
import time
import webbrowser
from pathlib import Path

from eval_lib import find_eval_project, find_project_root, generate_eval_report_html, parse_skill_md, run_eval


def discover_skills(search_dirs: list[str]) -> list[Path]:
    """Find all skill directories that have evals/trigger-evals.json."""
    skills = []
    for search_dir in search_dirs:
        for trigger_file in Path(search_dir).rglob("evals/trigger-evals.json"):
            skill_dir = trigger_file.parent.parent
            if (skill_dir / "SKILL.md").exists():
                skills.append(skill_dir)
    return sorted(skills)


def main():
    parser = argparse.ArgumentParser(description="Run trigger evaluation for skill descriptions")
    parser.add_argument("--skill-path", help="Evaluate a single skill directory (overrides discovery)")
    parser.add_argument("--discover", nargs="*", default=["skills/"], help="Directories to search for skills with trigger evals (default: skills/)")
    parser.add_argument("--model", default=None, help="Model to use for claude -p")
    parser.add_argument("--num-workers", type=int, default=10, help="Number of parallel workers")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout per query in seconds")
    parser.add_argument("--runs-per-query", type=int, default=1, help="Number of runs per query")
    parser.add_argument("--trigger-threshold", type=float, default=0.5, help="Trigger rate threshold")
    parser.add_argument("--verbose", action="store_true", help="Print progress to stderr")
    parser.add_argument("--output", default=None, help="Write JSON results to file")
    parser.add_argument("--report", default="auto", help="HTML report path ('auto' for temp file, 'none' to disable)")
    parser.add_argument("--previous", default=None, help="Path to previous results JSON for comparison deltas")
    parser.add_argument("--view", default=None, help="View an existing results JSON as HTML report (skips eval)")
    args = parser.parse_args()

    # View-only mode: just render the report from a JSON file
    if args.view:
        view_data = json.loads(Path(args.view).read_text())
        previous = json.loads(Path(args.previous).read_text()) if args.previous else None
        html = generate_eval_report_html(view_data, previous=previous)
        if args.report == "auto":
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            report_path = Path(tempfile.gettempdir()) / f"skill_eval_report_{timestamp}.html"
        elif args.report != "none":
            report_path = Path(args.report)
        else:
            report_path = Path(tempfile.gettempdir()) / f"skill_eval_report_{time.strftime('%Y%m%d_%H%M%S')}.html"
        report_path.write_text(html)
        webbrowser.open(str(report_path))
        print(f"Report: {report_path}", file=sys.stderr)
        return

    project_root = find_eval_project()

    # Build list of skills to evaluate
    if args.skill_path:
        skill_path = Path(args.skill_path)
        if not (skill_path / "SKILL.md").exists():
            print(f"Error: No SKILL.md found at {skill_path}", file=sys.stderr)
            sys.exit(1)
        eval_file = skill_path / "evals" / "trigger-evals.json"
        if not eval_file.exists():
            print(f"Error: No trigger evals found at {eval_file}", file=sys.stderr)
            sys.exit(1)
        skills = [(skill_path, eval_file)]
    else:
        discovered = discover_skills(args.discover)
        if not discovered:
            print(f"No skills with evals/trigger-evals.json found in {args.discover}", file=sys.stderr)
            sys.exit(1)
        skills = [(s, s / "evals" / "trigger-evals.json") for s in discovered]
        if args.verbose:
            print(f"Discovered {len(skills)} skills with trigger evals", file=sys.stderr)

    all_results = []
    total_pass = 0
    total_queries = 0

    for skill_path, eval_file in skills:
        eval_set = json.loads(eval_file.read_text())
        name, description, _ = parse_skill_md(skill_path)

        if args.verbose:
            print(f"\n{'='*60}", file=sys.stderr)
            print(f"Skill: {name} ({len(eval_set)} queries)", file=sys.stderr)

        output = run_eval(
            eval_set=eval_set,
            skill_name=name,
            description=description,
            num_workers=args.num_workers,
            timeout=args.timeout,
            project_root=project_root,
            runs_per_query=args.runs_per_query,
            trigger_threshold=args.trigger_threshold,
            model=args.model,
        )

        summary = output["summary"]
        total_pass += summary["passed"]
        total_queries += summary["total"]

        if args.verbose:
            print(f"  Score: {summary['passed']}/{summary['total']}", file=sys.stderr)
            for r in output["results"]:
                status = "PASS" if r["pass"] else "FAIL"
                rate_str = f"{r['triggers']}/{r['runs']}"
                expected = "trigger" if r["should_trigger"] else "no-trigger"
                print(f"    [{status}] rate={rate_str} expected={expected}: {r['query'][:65]}", file=sys.stderr)

        all_results.append({
            "skill_name": name,
            "skill_path": str(skill_path),
            "description": description,
            **output,
        })

    # Summary
    if args.verbose and len(skills) > 1:
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"TOTAL: {total_pass}/{total_queries} passed across {len(skills)} skills", file=sys.stderr)
        for r in all_results:
            s = r["summary"]
            status = "PASS" if s["failed"] == 0 else "FAIL"
            print(f"  [{status}] {r['skill_name']}: {s['passed']}/{s['total']}", file=sys.stderr)

    # Output
    final = {
        "model": args.model,
        "runs_per_query": args.runs_per_query,
        "total_passed": total_pass,
        "total_queries": total_queries,
        "skills": all_results,
    }

    json_output = json.dumps(final, indent=2)
    if args.output:
        Path(args.output).write_text(json_output)
        print(f"Results written to {args.output}", file=sys.stderr)
    else:
        print(json_output)

    # HTML report
    if args.report != "none":
        previous = None
        if args.previous:
            previous = json.loads(Path(args.previous).read_text())

        html = generate_eval_report_html(final, previous=previous)

        if args.report == "auto":
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            report_path = Path(tempfile.gettempdir()) / f"skill_eval_report_{timestamp}.html"
        else:
            report_path = Path(args.report)

        report_path.write_text(html)
        webbrowser.open(str(report_path))
        print(f"Report: {report_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
