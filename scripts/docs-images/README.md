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

### Interactive terminal applications

For Codex CLI, Claude Code, or another terminal UI, run the application inside
tmux and capture its actual pane. Freeze documents this under
[Screenshot TUIs](https://github.com/charmbracelet/freeze#screenshot-tuis).

Start a dedicated session from the project used for the demonstration:

```sh
tmux new-session -s b2c-demo
```

Run the client normally and complete the task. From a separate terminal, in this
repository, save the pane and render it with the shared style:

```sh
mkdir -p design-references/captures
tmux capture-pane -p -e -t b2c-demo:0.0 > design-references/captures/mcp-demo.ansi
freeze design-references/captures/mcp-demo.ansi \
  --config scripts/docs-images/freeze.json \
  --output design-references/captures/mcp-demo.png
```

`-p` writes the pane to stdout; `-e` preserves ANSI colors and styling. Adjust
the target if the client runs in another window or pane. Capture from a separate
terminal so the capture command does not replace the application view.

Choose the terminal width before the run (roughly 90-110 columns is a useful
starting point) and keep the prompt and completed result in view. The command
captures the current screen; use explicit `-S` and `-E` line bounds if the desired
excerpt is in scrollback. Avoid joining wrapped lines: preserve the client's
actual layout. Review the saved ANSI snapshot before publishing the image.

This captures terminal text and colors, not graphical terminal images or desktop
application chrome. Use native screenshots for Codex desktop and ChatGPT Work.
Keep raw captures local; copy only reviewed images into `docs/public/` and add
their captions, alt text, client version, and capture date to the asset notes.

### CLI command output

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
