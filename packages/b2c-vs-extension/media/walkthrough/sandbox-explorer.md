# Sandbox Explorer

Manage your B2C Commerce development sandboxes directly from VS Code!

## Prerequisites

⚠️ **Requires OAuth credentials** configured in `dw.json`. If you haven't set up OAuth yet, go back to the "Set Up OAuth Credentials" step.

## What is a Sandbox?

A sandbox is an isolated B2C Commerce development environment where you can:
- Develop and test code changes
- Import/export data
- Configure site settings
- Test storefront functionality

Each sandbox has its own:
- Database
- Code versions
- Configuration
- Users and permissions

## Opening the Sandbox Explorer

Click **Open Sandbox Explorer** above, or:
- Open the **B2C-DX Sandboxes** activity bar icon (left sidebar)
- View the **Realm Explorer**

## Key Concepts

### Realm
Your **realm** is your organization's collection of sandboxes. One realm can have multiple sandboxes.

### Sandbox States
- 🟢 **Started**: Sandbox is running and accessible
- 🔴 **Stopped**: Sandbox is paused (saves resources)
- 🟡 **Starting**: Sandbox is booting up
- 🟠 **Stopping**: Sandbox is shutting down

## Common Operations

### Add a Realm
1. Click the **+** icon in Realm Explorer
2. Enter your realm name (short code)
3. Credentials will be used from `dw.json`

### Create a Sandbox
1. Right-click your realm
2. Select **Create Sandbox**
3. Enter a sandbox name
4. Wait for provisioning (2-5 minutes)

### Start a Sandbox
1. Right-click a stopped sandbox
2. Select **Start Sandbox**
3. Wait for startup (~1-2 minutes)

### Stop a Sandbox
1. Right-click a started sandbox
2. Select **Stop Sandbox**
3. Confirm the action

### Restart a Sandbox
1. Right-click a started sandbox
2. Select **Restart Sandbox**
3. Useful for clearing cache or applying changes

### View Sandbox Details
1. Right-click any sandbox
2. Select **View Details**
3. See status, expiration, hostname, etc.

### Open Business Manager
1. Right-click a started sandbox
2. Select **Open Business Manager**
3. BM opens in your default browser

### Extend Sandbox Expiration
1. Right-click any sandbox
2. Select **Extend Expiration**
3. Choose extension period
4. Prevents automatic deletion

### Delete a Sandbox
1. Right-click any sandbox
2. Select **Delete Sandbox**
3. Confirm deletion
4. ⚠️ **Warning**: This is permanent!

## Status Bar Integration

When connected to a sandbox, the status bar shows:
- **☁️ Instance name**: Click to switch instances
- **$(pinned)**: Indicates pinned project root

## Tips

💡 **Stop when not in use**: Save resources by stopping sandboxes you're not actively using.

💡 **Watch expiration dates**: Sandboxes auto-delete after expiration. Extend them regularly!

💡 **One realm per team**: Share a realm with your team for easier collaboration.

💡 **Test on multiple sandboxes**: Use different sandboxes for feature branches or testing.

## Sandbox Lifecycle Best Practices

1. **Start** a sandbox when you begin working
2. **Develop** and deploy code changes
3. **Test** on the sandbox storefront
4. **Stop** the sandbox when done for the day
5. **Extend** expiration if working on long-term features
6. **Delete** when completely done with a feature

---

Click **Open Sandbox Explorer** to start managing your sandboxes!
