/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Box, useApp, useInput, useStdout} from 'ink';
import type {AuthConfig, OdsClient} from '@salesforce/b2c-tooling-sdk';

import {useFullscreen} from './hooks/use-fullscreen.js';
import {useSandboxes} from './hooks/use-sandboxes.js';
import {useSandboxActions} from './hooks/use-sandbox-actions.js';
import {useWebDav} from './hooks/use-webdav.js';
import {Header} from './components/header.js';
import {Footer} from './components/footer.js';
import {SandboxList} from './components/sandbox-list.js';
import {SandboxDetail} from './components/sandbox-detail.js';
import {FileBrowser, sortEntries} from './components/file-browser.js';
import type {FileViewerRef} from './components/file-viewer.js';
import {FileViewer} from './components/file-viewer.js';
import {HelpOverlay} from './components/help-overlay.js';
import {CommandPalette} from './components/command-palette.js';
import {ConfirmModal} from './components/confirm-modal.js';
import {SortMenu} from './components/sort-menu.js';
import {LogTailView} from './components/log-tail-view.js';
import {LogConfigOverlay} from './components/log-config-overlay.js';
import {
  DEFAULT_LOG_CONFIG,
  DEFAULT_SORT,
  SANDBOX_COMMANDS,
  WEBDAV_ROOTS,
  type LogTailConfig,
  type SandboxModel,
  type SortState,
  type ViewState,
} from './types.js';

interface AppProps {
  authConfig: AuthConfig;
  filterParams?: string;
  odsClient: OdsClient;
  realm?: string;
}

// Footer (3 lines with border) + content box borders (2)
const BASE_CHROME_HEIGHT = 5;
// Header: 3 lines for sandbox list view, 5 lines when viewing sandbox details (3 rows + borders)
const HEADER_HEIGHT_LIST = 3;
const HEADER_HEIGHT_DETAIL = 5;

export function App({authConfig, filterParams, odsClient, realm}: AppProps): React.ReactElement {
  const {exit} = useApp();
  const {stdout} = useStdout();

  // View state management
  const [viewStack, setViewStack] = useState<ViewState[]>([{type: 'sandbox-list'}]);
  const currentView = viewStack.at(-1) ?? {type: 'sandbox-list' as const};

  // Selection indices for each view type
  const [sandboxIndex, setSandboxIndex] = useState(0);
  const [rootIndex, setRootIndex] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);

  // Ref for file viewer scrolling
  const fileViewerRef = useRef<FileViewerRef>(null);

  const [showHelp, setShowHelp] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showLogConfig, setShowLogConfig] = useState(false);
  const [logSearchText, setLogSearchText] = useState('');
  const [isLogSearching, setIsLogSearching] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<null | {commandId: string; sandbox: SandboxModel}>(null);

  // Sort and filter state
  const [sortState, setSortState] = useState<SortState>(DEFAULT_SORT);
  const [filterText, setFilterText] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // Enable fullscreen/alternate screen mode
  useFullscreen();

  // Fetch and poll sandboxes
  const {
    error: sandboxError,
    lastUpdated,
    loading: sandboxLoading,
    refresh,
    sandboxes,
  } = useSandboxes(odsClient, filterParams);

  // Sandbox actions (start, stop, restart, delete)
  const {
    deleteSandbox,
    error: actionError,
    executing: actionExecuting,
    executeSandboxOperation,
  } = useSandboxActions(odsClient);

  // Apply sorting and filtering to sandboxes
  const displayedSandboxes = useMemo(() => {
    let result = [...sandboxes];

    // Apply filter
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      result = result.filter((sandbox) => {
        const searchFields = [
          sandbox.realm,
          sandbox.instance,
          sandbox.state,
          sandbox.resourceProfile,
          sandbox.hostName,
          sandbox.createdBy,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchFields.includes(lowerFilter);
      });
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortState.field) {
        case 'realm-instance': {
          // Sort by realm first, then by instance number
          const realmCompare = (a.realm ?? '').localeCompare(b.realm ?? '');
          if (realmCompare === 0) {
            // Parse instance as number for proper numeric sorting
            const aNum = Number.parseInt(a.instance ?? '0', 10);
            const bNum = Number.parseInt(b.instance ?? '0', 10);
            comparison = aNum - bNum;
          } else {
            comparison = realmCompare;
          }
          break;
        }
        case 'size': {
          // Sort by resource profile (medium < large < xlarge < xxlarge)
          const sizeOrder: Record<string, number> = {large: 2, medium: 1, xlarge: 3, xxlarge: 4};
          const aSize = sizeOrder[a.resourceProfile ?? ''] ?? 0;
          const bSize = sizeOrder[b.resourceProfile ?? ''] ?? 0;
          comparison = aSize - bSize;
          break;
        }
        case 'state': {
          // Sort by state (started first, then others alphabetically)
          const stateOrder: Record<string, number> = {
            creating: 3,
            deleted: 8,
            deleting: 7,
            failed: 6,
            started: 1,
            starting: 2,
            stopped: 5,
            stopping: 4,
          };
          const aState = stateOrder[a.state ?? ''] ?? 9;
          const bState = stateOrder[b.state ?? ''] ?? 9;
          comparison = aState - bState;
          break;
        }
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [sandboxes, sortState, filterText]);

  // Get current sandbox hostname for WebDAV and log tailing
  const currentSandbox: SandboxModel | undefined =
    currentView.type === 'sandbox-detail' ||
    currentView.type === 'file-browser' ||
    currentView.type === 'file-viewer' ||
    currentView.type === 'log-tail'
      ? currentView.sandbox
      : undefined;

  // WebDAV operations
  const {
    entries: webdavEntries,
    error: webdavError,
    fileContent,
    listDirectory,
    loading: webdavLoading,
    readFile,
  } = useWebDav(currentSandbox?.hostName, authConfig);

  // Calculate available height for content (header is taller when viewing sandbox details)
  const terminalHeight = stdout?.rows ?? 24;
  const headerHeight = currentSandbox ? HEADER_HEIGHT_DETAIL : HEADER_HEIGHT_LIST;
  const availableHeight = Math.max(5, terminalHeight - BASE_CHROME_HEIGHT - headerHeight);

  // Get current list length for navigation bounds
  const getCurrentListLength = useCallback((): number => {
    switch (currentView.type) {
      case 'file-browser': {
        return webdavEntries.length;
      }
      case 'file-viewer': {
        return 0; // File viewer handles its own scrolling via ref
      }
      case 'log-tail': {
        return 0; // Log tail view handles its own scrolling
      }
      case 'sandbox-detail': {
        return WEBDAV_ROOTS.length;
      }
      case 'sandbox-list': {
        return displayedSandboxes.length;
      }
      default: {
        return 0;
      }
    }
  }, [currentView.type, displayedSandboxes.length, webdavEntries.length]);

  // Navigation helpers
  const moveUp = useCallback(() => {
    switch (currentView.type) {
      case 'file-browser': {
        setFileIndex((prev) => Math.max(0, prev - 1));
        break;
      }
      case 'file-viewer': {
        fileViewerRef.current?.scrollBy(-1);
        break;
      }
      case 'sandbox-detail': {
        setRootIndex((prev) => Math.max(0, prev - 1));
        break;
      }
      case 'sandbox-list': {
        setSandboxIndex((prev) => Math.max(0, prev - 1));
        break;
      }
    }
  }, [currentView.type]);

  const moveDown = useCallback(() => {
    const maxIndex = Math.max(0, getCurrentListLength() - 1);
    switch (currentView.type) {
      case 'file-browser': {
        setFileIndex((prev) => Math.min(maxIndex, prev + 1));
        break;
      }
      case 'file-viewer': {
        fileViewerRef.current?.scrollBy(1);
        break;
      }
      case 'sandbox-detail': {
        setRootIndex((prev) => Math.min(maxIndex, prev + 1));
        break;
      }
      case 'sandbox-list': {
        setSandboxIndex((prev) => Math.min(maxIndex, prev + 1));
        break;
      }
    }
  }, [currentView.type, getCurrentListLength]);

  const goBack = useCallback(() => {
    if (viewStack.length > 1) {
      setViewStack((prev) => prev.slice(0, -1));
      // Reset indices when going back
      if (currentView.type === 'file-browser') {
        setFileIndex(0);
      }
    }
  }, [viewStack.length, currentView.type]);

  const openSelected = useCallback(() => {
    switch (currentView.type) {
      case 'file-browser': {
        const sortedWebdavEntries = sortEntries(webdavEntries);
        const entry = sortedWebdavEntries[fileIndex];
        if (entry && currentView.sandbox) {
          // Extract path from href
          const hrefPath = decodeURIComponent(entry.href);
          const sitesIndex = hrefPath.indexOf('/Sites/');
          const relativePath = sitesIndex === -1 ? hrefPath : hrefPath.slice(sitesIndex + 7);

          if (entry.isCollection) {
            // Navigate into directory
            setViewStack((prev) => [...prev, {path: relativePath, sandbox: currentView.sandbox, type: 'file-browser'}]);
            setFileIndex(0);
          } else {
            // Open file viewer
            setViewStack((prev) => [...prev, {path: relativePath, sandbox: currentView.sandbox, type: 'file-viewer'}]);
          }
        }
        break;
      }
      case 'sandbox-detail': {
        const root = WEBDAV_ROOTS[rootIndex];
        if (root && currentView.sandbox) {
          setViewStack((prev) => [...prev, {path: root.key, sandbox: currentView.sandbox, type: 'file-browser'}]);
          setFileIndex(0);
        }
        break;
      }
      case 'sandbox-list': {
        const sandbox = displayedSandboxes[sandboxIndex];
        if (sandbox) {
          setViewStack((prev) => [...prev, {sandbox, type: 'sandbox-detail'}]);
          setRootIndex(0);
        }
        break;
      }
    }
  }, [currentView, displayedSandboxes, sandboxIndex, rootIndex, webdavEntries, fileIndex]);

  // Load directory contents when entering file-browser view
  useEffect(() => {
    if (currentView.type === 'file-browser') {
      listDirectory(currentView.path);
    }
  }, [currentView, listDirectory]);

  // Load file contents when entering file-viewer view
  useEffect(() => {
    if (currentView.type === 'file-viewer') {
      readFile(currentView.path);
    }
  }, [currentView, readFile]);

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
  }, []);

  // Get the sandbox for command palette (either from current view or selected in list)
  const getCommandPaletteSandbox = useCallback((): SandboxModel | undefined => {
    if (currentSandbox) return currentSandbox;
    if (currentView.type === 'sandbox-list') {
      return displayedSandboxes[sandboxIndex];
    }
    return undefined;
  }, [currentSandbox, currentView.type, displayedSandboxes, sandboxIndex]);

  const openCommandPalette = useCallback(() => {
    const sandbox = getCommandPaletteSandbox();
    if (sandbox) {
      setShowCommandPalette(true);
    }
  }, [getCommandPaletteSandbox]);

  const closeCommandPalette = useCallback(() => {
    setShowCommandPalette(false);
  }, []);

  const openSortMenu = useCallback(() => {
    if (currentView.type === 'sandbox-list') {
      setShowSortMenu(true);
    }
  }, [currentView.type]);

  const closeSortMenu = useCallback(() => {
    setShowSortMenu(false);
  }, []);

  const handleSortSelect = useCallback((newSort: SortState) => {
    setSortState(newSort);
    setShowSortMenu(false);
    // Reset selection when sort changes
    setSandboxIndex(0);
  }, []);

  const startFiltering = useCallback(() => {
    if (currentView.type === 'sandbox-list') {
      setIsFiltering(true);
    }
  }, [currentView.type]);

  // Open log tail view for a sandbox
  const openLogTail = useCallback((sandbox: SandboxModel) => {
    setViewStack((prev) => [
      ...prev,
      {
        config: {...DEFAULT_LOG_CONFIG},
        sandbox,
        type: 'log-tail',
      },
    ]);
  }, []);

  // Handle opening log tail from current context
  const handleOpenLogTail = useCallback(() => {
    if (currentView.type === 'sandbox-list') {
      const sandbox = displayedSandboxes[sandboxIndex];
      if (sandbox) {
        openLogTail(sandbox);
      }
    } else if (currentView.type === 'sandbox-detail') {
      openLogTail(currentView.sandbox);
    }
  }, [currentView, displayedSandboxes, sandboxIndex, openLogTail]);

  // Handle log config changes
  const handleLogConfigApply = useCallback(
    (newConfig: LogTailConfig) => {
      setShowLogConfig(false);
      // Apply search text to config
      const configWithSearch = {...newConfig, search: logSearchText || undefined};
      // Update the current view's config
      setViewStack((prev) => {
        const last = prev.at(-1);
        if (last?.type === 'log-tail') {
          return [...prev.slice(0, -1), {...last, config: configWithSearch}];
        }
        return prev;
      });
    },
    [logSearchText],
  );

  const handleLogConfigCancel = useCallback(() => {
    setShowLogConfig(false);
  }, []);

  const openLogConfig = useCallback(() => {
    setShowLogConfig(true);
  }, []);

  const openLogSearch = useCallback(() => {
    setIsLogSearching(true);
  }, []);

  const handleCommandExecute = useCallback(
    async (commandId: string) => {
      const sandbox = getCommandPaletteSandbox();
      if (!sandbox) return;

      // Find the command
      const command = SANDBOX_COMMANDS.find((cmd) => cmd.id === commandId);
      if (!command) return;

      // If command requires confirmation, show confirmation modal
      if (command.requiresConfirmation) {
        setPendingCommand({commandId, sandbox});
        setShowCommandPalette(false);
        return;
      }

      // Execute immediately for non-confirmation commands
      setShowCommandPalette(false);
      await executeCommand(commandId, sandbox);
    },
    [getCommandPaletteSandbox],
  );

  const executeCommand = useCallback(
    async (commandId: string, sandbox: SandboxModel) => {
      switch (commandId) {
        case 'copy-host': {
          // Copy hostname to clipboard
          if (sandbox.hostName) {
            const {exec} = await import('node:child_process');
            const cmd =
              process.platform === 'darwin'
                ? `echo -n "${sandbox.hostName}" | pbcopy`
                : process.platform === 'win32'
                  ? `echo ${sandbox.hostName} | clip`
                  : `echo -n "${sandbox.hostName}" | xclip -selection clipboard`;
            exec(cmd);
          }
          break;
        }
        case 'delete': {
          const success = await deleteSandbox(sandbox);
          if (success) {
            // Go back to sandbox list after delete
            setViewStack([{type: 'sandbox-list'}]);
            refresh();
          }
          break;
        }
        case 'open-bm': {
          // Open Business Manager in browser
          if (sandbox.hostName) {
            const {exec} = await import('node:child_process');
            const url = `https://${sandbox.hostName}/on/demandware.store/Sites-Site/default/ViewApplication-ProcessLogin`;
            // Use open command based on platform
            const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
            exec(`${cmd} "${url}"`);
          }
          break;
        }
        case 'restart':
        case 'start':
        case 'stop': {
          const success = await executeSandboxOperation(sandbox, commandId);
          if (success) {
            refresh();
          }
          break;
        }
      }
    },
    [deleteSandbox, executeSandboxOperation, refresh],
  );

  const handleConfirm = useCallback(async () => {
    if (pendingCommand) {
      await executeCommand(pendingCommand.commandId, pendingCommand.sandbox);
      setPendingCommand(null);
    }
  }, [pendingCommand, executeCommand]);

  const handleCancelConfirm = useCallback(() => {
    setPendingCommand(null);
  }, []);

  // Handle filter input mode
  useInput(
    (input, key) => {
      // Exit filter mode
      if (key.escape) {
        setIsFiltering(false);
        setFilterText('');
        setSandboxIndex(0);
        return;
      }

      // Confirm filter (exit filter mode but keep filter text)
      if (key.return) {
        setIsFiltering(false);
        setSandboxIndex(0);
        return;
      }

      // Backspace in filter
      if (key.backspace || key.delete) {
        setFilterText((prev) => prev.slice(0, -1));
        setSandboxIndex(0);
        return;
      }

      // Type to add to filter
      if (input.length === 1) {
        setFilterText((prev) => prev + input);
        setSandboxIndex(0);
      }
    },
    {isActive: isFiltering},
  );

  // Handle log search input mode
  useInput(
    (input, key) => {
      // Exit search mode
      if (key.escape) {
        setIsLogSearching(false);
        setLogSearchText('');
        // Update the config to clear search
        setViewStack((prev) => {
          const last = prev.at(-1);
          if (last?.type === 'log-tail') {
            return [...prev.slice(0, -1), {...last, config: {...last.config, search: undefined}}];
          }
          return prev;
        });
        return;
      }

      // Confirm search (exit search mode but keep search text)
      if (key.return) {
        setIsLogSearching(false);
        // Apply search to config
        setViewStack((prev) => {
          const last = prev.at(-1);
          if (last?.type === 'log-tail') {
            return [...prev.slice(0, -1), {...last, config: {...last.config, search: logSearchText || undefined}}];
          }
          return prev;
        });
        return;
      }

      // Backspace in search
      if (key.backspace || key.delete) {
        setLogSearchText((prev) => prev.slice(0, -1));
        return;
      }

      // Type to add to search
      if (input.length === 1) {
        setLogSearchText((prev) => prev + input);
      }
    },
    {isActive: isLogSearching},
  );

  // Handle keyboard input (only when no overlays are showing)
  // Note: log-tail view handles its own input
  useInput(
    (input, key) => {
      // Don't process main input when overlays are showing or in log-tail view
      if (showCommandPalette || showSortMenu || showLogConfig || pendingCommand || isFiltering || isLogSearching) {
        return;
      }

      // Quit
      if (input === 'q') {
        exit();
      }

      // Toggle help
      if (input === '?') {
        toggleHelp();
      }

      // Open command palette with ':'
      if (input === ':' && !showHelp) {
        openCommandPalette();
        return;
      }

      // Open sort menu with 'o' (only in sandbox list)
      if (input === 'o' && !showHelp && currentView.type === 'sandbox-list') {
        openSortMenu();
        return;
      }

      // Start filtering with '/' (only in sandbox list)
      if (input === '/' && !showHelp && currentView.type === 'sandbox-list') {
        startFiltering();
        return;
      }

      // Open log tail with 'L' (only in sandbox list or sandbox detail)
      if (
        input === 'L' &&
        !showHelp &&
        (currentView.type === 'sandbox-list' || currentView.type === 'sandbox-detail')
      ) {
        handleOpenLogTail();
        return;
      }

      // Close help with Esc
      if (key.escape) {
        if (showHelp) {
          setShowHelp(false);
        } else if (filterText) {
          // Clear filter if one is active
          setFilterText('');
          setSandboxIndex(0);
        } else {
          goBack();
        }
      }

      // Backspace to go back (but not if filter is active - use Esc to clear filter first)
      if ((key.backspace || key.delete) && !filterText) {
        goBack();
      }

      // Navigation (only when help is not shown and not in log-tail)
      if (!showHelp && currentView.type !== 'log-tail') {
        if (key.upArrow || input === 'k') {
          moveUp();
        }
        if (key.downArrow || input === 'j') {
          moveDown();
        }
        // Enter to open/select
        if (key.return) {
          openSelected();
        }
        // Refresh (only in sandbox list)
        if (input === 'R' && currentView.type === 'sandbox-list') {
          refresh();
        }
      }
    },
    {
      isActive:
        !showCommandPalette &&
        !showSortMenu &&
        !showLogConfig &&
        !pendingCommand &&
        !isFiltering &&
        !isLogSearching &&
        currentView.type !== 'log-tail',
    },
  );

  // Determine what to show in header
  const getHeaderInfo = () => {
    // Action error takes precedence
    const effectiveError = actionError ?? (currentView.type === 'sandbox-list' ? sandboxError : webdavError);
    const effectiveLoading = actionExecuting || (currentView.type === 'sandbox-list' ? sandboxLoading : webdavLoading);

    switch (currentView.type) {
      case 'file-browser':
      case 'file-viewer':
      case 'log-tail':
      case 'sandbox-detail': {
        return {
          error: effectiveError,
          lastUpdated: null,
          loading: effectiveLoading,
          realm: undefined,
          sandbox: currentView.sandbox,
        };
      }
      case 'sandbox-list': {
        return {error: effectiveError, lastUpdated, loading: effectiveLoading, realm, sandbox: undefined};
      }
      default: {
        return {error: null, lastUpdated: null, loading: false, realm: undefined, sandbox: undefined};
      }
    }
  };

  const headerInfo = getHeaderInfo();

  // Render current view content
  const renderContent = () => {
    // Overlays take precedence
    if (pendingCommand) {
      const command = SANDBOX_COMMANDS.find((cmd) => cmd.id === pendingCommand.commandId);
      return (
        <ConfirmModal
          message={command?.confirmationMessage ?? `Execute ${pendingCommand.commandId}?`}
          onCancel={handleCancelConfirm}
          onConfirm={handleConfirm}
          title={command?.label ?? 'Confirm'}
          variant={pendingCommand.commandId === 'delete' ? 'danger' : 'default'}
        />
      );
    }

    if (showCommandPalette) {
      const sandbox = getCommandPaletteSandbox();
      if (sandbox) {
        return <CommandPalette onClose={closeCommandPalette} onExecute={handleCommandExecute} sandbox={sandbox} />;
      }
    }

    if (showSortMenu) {
      return <SortMenu currentSort={sortState} onClose={closeSortMenu} onSelect={handleSortSelect} />;
    }

    if (showLogConfig && currentView.type === 'log-tail') {
      return (
        <LogConfigOverlay
          currentConfig={currentView.config}
          onApply={handleLogConfigApply}
          onCancel={handleLogConfigCancel}
        />
      );
    }

    if (showHelp) {
      return <HelpOverlay onClose={toggleHelp} viewType={currentView.type} />;
    }

    switch (currentView.type) {
      case 'file-browser': {
        return (
          <FileBrowser
            entries={webdavEntries}
            error={webdavError}
            loading={webdavLoading}
            maxVisibleRows={availableHeight - 4}
            path={currentView.path}
            selectedIndex={fileIndex}
          />
        );
      }
      case 'file-viewer': {
        return (
          <FileViewer
            content={fileContent}
            error={webdavError}
            loading={webdavLoading}
            maxVisibleRows={availableHeight - 4}
            path={currentView.path}
            ref={fileViewerRef}
          />
        );
      }
      case 'log-tail': {
        return (
          <LogTailView
            authConfig={authConfig}
            config={currentView.config}
            isActive={!showHelp && !showLogConfig && !isLogSearching}
            maxVisibleRows={availableHeight - 4}
            onGoBack={goBack}
            onOpenConfig={openLogConfig}
            onOpenSearch={openLogSearch}
            sandbox={currentView.sandbox}
          />
        );
      }
      case 'sandbox-detail': {
        return <SandboxDetail maxVisibleRows={availableHeight - 4} onSelectRoot={() => {}} selectedIndex={rootIndex} />;
      }
      case 'sandbox-list': {
        return (
          <SandboxList
            maxVisibleRows={availableHeight - 4}
            sandboxes={displayedSandboxes}
            selectedIndex={sandboxIndex}
          />
        );
      }
      default: {
        return null;
      }
    }
  };

  return (
    <Box flexDirection="column" height={terminalHeight}>
      <Header
        error={headerInfo.error}
        filterText={filterText}
        isFiltering={isFiltering}
        isLogSearching={isLogSearching}
        lastUpdated={headerInfo.lastUpdated}
        loading={headerInfo.loading}
        logConfig={currentView.type === 'log-tail' ? currentView.config : undefined}
        logSearchText={logSearchText}
        realm={headerInfo.realm}
        sandbox={headerInfo.sandbox}
        sort={currentView.type === 'sandbox-list' ? sortState : undefined}
      />

      <Box borderStyle="single" flexDirection="column" flexGrow={1} height={availableHeight}>
        {renderContent()}
      </Box>

      <Footer
        canGoBack={viewStack.length > 1}
        sandboxCount={currentView.type === 'sandbox-list' ? displayedSandboxes.length : undefined}
        viewType={currentView.type}
      />
    </Box>
  );
}
