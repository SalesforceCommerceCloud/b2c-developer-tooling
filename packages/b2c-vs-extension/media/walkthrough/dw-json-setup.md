# Configure Your B2C Instance

The `dw.json` file stores your B2C Commerce instance connection details. This file should be in your workspace root.

## Quick Setup

Click **Create dw.json Template** above to generate a starter configuration file.

## Required Fields

Your `dw.json` needs these basic fields:

```json
{
  "hostname": "your-sandbox-name.demandware.net",
  "username": "your-username",
  "password": "your-password"
}
```

### Where to Find These Values

- **hostname**: Your sandbox URL (without `https://`)
- **username**: Your Business Manager username
- **password**: Your Business Manager password

## Example Configuration

```json
{
  "hostname": "dev01-na01-acme.demandware.net",
  "username": "developer@acme.com",
  "password": "your-secure-password",
  "version": "v1"
}
```

## Security Note

⚠️ **Important:** Add `dw.json` to your `.gitignore` file to avoid committing credentials!

```gitignore
# .gitignore
dw.json
```

## Multiple Instances

You can configure multiple instances in `dw.json`. Use the instance switcher in the status bar to change between them.

```json
{
  "instances": [
    {
      "name": "dev",
      "hostname": "dev01-acme.demandware.net",
      "username": "dev@acme.com",
      "password": "password1"
    },
    {
      "name": "staging",
      "hostname": "staging-acme.demandware.net",
      "username": "dev@acme.com",
      "password": "password2"
    }
  ]
}
```

---

Once you've created and configured `dw.json`, this step will complete automatically!
