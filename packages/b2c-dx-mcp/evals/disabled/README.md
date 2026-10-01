# Disabled cases

Cases here are excluded from the suite (`claude plugin eval` only loads `cases/`). Move a case back once its blocker is fixed.

| Case                           | Blocker                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/catalog-xsd-online-flag` | `docs_schema_read` returns the whole XSD (`catalog.xsd` is ~80 KB). Claude Code persists the oversized result to a file the agent can't read, so it loops until `max_turns` and fails 3/3 with the plugin at ~$0.16/run. Needs an element filter or paging on `docs_schema_read`; see the improvement note in `../README.md`. |
