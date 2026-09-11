# CLI documentation images

Render the reviewed command output with [Freeze](https://github.com/charmbracelet/freeze).
The style follows Freeze's defaults with window controls and a 12px corner radius,
equivalent to `freeze --execute "b2c code list" --window --border.radius 12`.
The same palette, font, and window frame apply to every image. Freeze 0.2.2 is
the baseline used for these captures; no live credentials are needed to render.

```sh
brew install charmbracelet/tap/freeze
node scripts/docs-images/render.mjs
```

Set `FREEZE_BIN` if Freeze is outside your PATH. Outputs are PNGs under
`docs/public/`. The Markdoc comparison copies those same assets.

## Refresh a capture

Run these read-only commands in a configured test project:

```sh
b2c code list -c id,active,rollback --log-level silent
b2c scapi custom status -c apiName,httpMethod,status --log-level silent
```

Review the output before replacing the corresponding `.txt` file here. Keep
credentials, hostnames, personal paths, and customer data out of public assets.
The saved tables currently come from a test sandbox. Logging is suppressed in
captures; the displayed commands omit that presentation-only flag.

The homepage combines both commands and marks the shortened Custom API output
with an ellipsis. Individual images show full captured output. Commands remain
available as text on the relevant documentation pages, and images have alt text.

Use one image near a relevant task or capability. Prefer common outcomes over
help listings, large JSON responses, or a terminal screenshot on every page.
Keep prose, installation commands, and reference tables readable without images.

These are authored B2C documentation assets. Downloaded reference images and
design research stay outside this directory and remain excluded from Git.
