# MRT Project Commands Reference

Detailed reference for MRT project, member, and notification commands.

## Project Management

### List Projects

```bash
b2c mrt project list
b2c mrt project list --limit 10 --offset 0
b2c mrt project list --json
```

### Create Project

```bash
b2c mrt project create my-storefront --name "My Storefront"
b2c mrt project create my-storefront --name "My Storefront" --organization my-org
```

### Get Project Details

```bash
b2c mrt project get --project my-storefront
b2c mrt project get -p my-storefront --json
```

### Update Project

```bash
b2c mrt project update --project my-storefront --name "Updated Name"
```

### Delete Project

```bash
b2c mrt project delete --project my-storefront
b2c mrt project delete -p my-storefront --force  # skip confirmation
```

## Member Management

Members can have one of three roles: `admin`, `developer`, or `viewer`.

### List Members

```bash
b2c mrt project member list --project my-storefront
b2c mrt project member list -p my-storefront --json
```

### Add Member

```bash
b2c mrt project member add user@example.com --project my-storefront --role admin
b2c mrt project member add user@example.com -p my-storefront --role developer
b2c mrt project member add user@example.com -p my-storefront --role viewer
```

### Get Member Details

```bash
b2c mrt project member get user@example.com --project my-storefront
```

### Update Member Role

```bash
b2c mrt project member update user@example.com --project my-storefront --role viewer
```

### Remove Member

```bash
b2c mrt project member remove user@example.com --project my-storefront
b2c mrt project member remove user@example.com -p my-storefront --force
```

## Deployment Notifications

Configure email notifications for deployment events (start, success, failure).

### List Notifications

```bash
b2c mrt project notification list --project my-storefront
b2c mrt project notification list -p my-storefront --json
```

### Create Notification

```bash
# Notify on deployment failures only
b2c mrt project notification create -p my-storefront \
  --target staging --target production \
  --recipient ops@example.com \
  --on-failed

# Notify on all deployment events
b2c mrt project notification create -p my-storefront \
  --target production \
  --recipient team@example.com \
  --on-start --on-success --on-failed

# Multiple recipients
b2c mrt project notification create -p my-storefront \
  --target production \
  --recipient dev@example.com --recipient ops@example.com \
  --on-failed
```

**Flags:**
| Flag | Description |
|------|-------------|
| `--target`, `-t` | Target environment (can specify multiple) |
| `--recipient`, `-r` | Email recipient (can specify multiple) |
| `--on-start` | Notify when deployment starts |
| `--on-success` | Notify when deployment succeeds |
| `--on-failed` | Notify when deployment fails |

### Get Notification Details

```bash
b2c mrt project notification get abc-123 --project my-storefront
b2c mrt project notification get abc-123 -p my-storefront --json
```

### Update Notification

```bash
# Change notification events
b2c mrt project notification update abc-123 -p my-storefront --on-start --no-on-failed

# Update recipients
b2c mrt project notification update abc-123 -p my-storefront --recipient new-team@example.com
```

### Delete Notification

```bash
b2c mrt project notification delete abc-123 --project my-storefront
b2c mrt project notification delete abc-123 -p my-storefront --force
```
