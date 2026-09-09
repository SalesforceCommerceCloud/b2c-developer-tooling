.PHONY: install test test-agent lint lint-agent format typecheck typecheck-agent generate-models build-sync docs clean

install:
	pip install -e ".[dev,docs]"

# Full test run with coverage
test:
	pytest --cov --cov-report=term-missing

# Condensed output for coding agents (failures + short summary only)
test-agent:
	pytest -q -p no:cacheprovider --no-header

lint:
	ruff check .

# Errors only, no warnings noise
lint-agent:
	ruff check --quiet .

format:
	ruff format .

format-check:
	ruff format --check .

typecheck:
	mypy

# Single-line errors, no color
typecheck-agent:
	mypy --no-color-output --no-error-summary

# Regenerate Pydantic models from specs/ (mirrors the TS `generate:types`)
generate-models:
	python scripts/generate_models.py

# Derive the synchronous client layer from the async source (unasync)
build-sync:
	python scripts/build_sync.py

docs:
	mkdocs serve

clean:
	rm -rf dist build .pytest_cache .mypy_cache .ruff_cache htmlcov
	find . -type d -name __pycache__ -prune -exec rm -rf {} +
