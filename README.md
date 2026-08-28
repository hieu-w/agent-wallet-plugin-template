# Agent Wallet plugin template

Starter for a third-party [`mm`](https://github.com/MetaMask/agentic) CLI plugin. Your package adds first-class `mm` commands (one-shot and REPL). Import only from `@metamask/agent-wallet/plugin`. Declare permissions in `package.json#mm`.

## Plugin developer guide

This is the plugin-side contract. The host runs your command, gates auth/init, renders the result, and restricts `this.ctx` to the capabilities the user approved.

### What you import

```ts
import {
  type CommandIO,
  CommandError,
  InputFieldType,
  type InputSchema,
  PluginCommand,
  schemaToArgs,
  schemaToFlags,
} from "@metamask/agent-wallet/plugin";
```

Published surface:

| Export | Role |
| --- | --- |
| `PluginCommand` | Base class. Implement `execute` plus `pluginCommandId`. |
| `PluginCommandContext` | Typed view of `this.ctx` (services the host exposes). |
| `CommandIO` | How you talk to the user / stdout (`emit`, `yield`, `resolveInputs`, …). |
| `schemaToFlags` / `schemaToArgs` + `InputFieldType` | Declare inputs once; host builds flags, positionals, and prompts. |
| `CommandError` / `ok` / `err` | Fail a command with a code + hint. |
| `PluginManifest` / `definePluginManifest` / `CAPABILITIES` / `DATA_ACCESS` | Manifest types and constants. |

`createAppContext` and the raw host `CommandContext` are **not** exported. Do not import `@metamask/agent-sdk` to reach around the restricted context.

### Command shape

1. Put one file per command under `src/commands/`. The path **is** the CLI id: `src/commands/ping.ts` → `mm ping`. Nested folders become topics: `src/commands/acme/report.ts` → `mm acme report` / id `acme:report`.
2. `pluginCommandId` **must** equal `package.json#mm.commands[].id`.
3. Pick an id that does **not** collide with a built-in `mm` command (`wallet:balance`, `config:get`, `swap:execute`, …). Prefer a namespace (`acme:report`).
4. Implement **only** `execute`. Optional hooks: `afterExecute`, `successHint`, `analyticsOutcome`.

```ts
export default class PingCommand extends PluginCommand<{ message: string }> {
  static override requiresAuth = false;
  static override requiresInit = false;
  static override description = "Example plugin: greet without auth";
  static override flags = schemaToFlags(inputs);
  static override args = schemaToArgs(inputs); // fields with `index` become `mm ping Alice`
  protected readonly pluginCommandId = "ping";

  async execute(io: CommandIO) {
    const { name } = await io.resolveInputs(inputs);
    return { message: name ? `pong, ${name}` : "pong" };
  }
}
```

The object you **return** from `execute` is the command result. The host renders it as text, `--json`, or `--toon`. Throw `CommandError` to fail:

```ts
throw new CommandError("NOT_FOUND", "No active wallet.", "Run `mm init` first.");
```

### What the host already does (do not reimplement)

Set these as **static fields**. Do not override the getters or lifecycle methods.

| Static | Default | Effect |
| --- | --- | --- |
| `requiresAuth` | `true` | Host checks / refreshes the CLI session (`mm login`). |
| `requiresInit` | `true` | Host requires `mm init` (wallet + trading mode). |
| `requiresFees` | `false` | Host warms the fee cache (only if auth is also required). |
| `description` | — | Shown in `mm help`. |
| `flags` | — | **Your** flags only. |

Every command already has `--format`, `--json`, `--toon`, and `--verbose`. Do not redeclare them.

**Sealed** (constructor throws `PLUGIN_SEALED_OVERRIDE` if you override): `run`, `runLifecycle`, `beforeExecute`, `init`, `prepareForRepl`, and the `requiresAuth` / `requiresInit` / `requiresFees` getters.

### Context (`this.ctx`)

Curated services. Capability gates apply at runtime for the sensitive ones.

| Field | Typical capability | What you can do |
| --- | --- | --- |
| `walletStateManager` | `wallet-read` | `read()` active / BYOK / remote wallets. |
| `accountService` | `wallet-read` | Account + transaction history. |
| `priceService` | `wallet-read` | Spot / history prices. |
| `tokenService` | `wallet-read` | Token discovery / metadata. |
| `networkRegistry` | `wallet-read` | Supported networks cache. |
| `feesService` | `wallet-read` | Fee quotes / cache. |
| `swapQuoteStore` | `wallet-read` | Persisted swap quotes. |
| `session` / `authService` | (session) | Current login / wallet mode. Prefer `dataAccess: ["session"]` if you read it. |
| `walletExecutor(io, pluginCommandId)` | `wallet-submit` | Sign / submit via MetaMask policy. Still MFA-gated. Missing capability → `PERMISSION_DENIED`. |
| `mnemonicStore` | `mnemonic-read` | Metadata only (e.g. `isEncrypted()`). Never print the secret. Missing capability → `PERMISSION_DENIED`. |
| `logger` | — | Structured logs. Never log secrets. |
| `args` / `flags` / `argv` | — | Parsed invocation. Prefer `io.resolveInputs` over reading flags by hand. |

`config-write` and `network-manage` are reserved capabilities (declare them for consent). No mutation API is gated on them yet.

### I/O (`io`)

Same `CommandIO` host commands use. Headless (`mm ping --json`) cannot prompt; REPL / TTY can.

| Method | Use |
| --- | --- |
| `io.resolveInputs(schema)` | Flags + positionals + prompts. Use this instead of parsing `this.ctx.flags`. |
| `io.emit(text)` | Print a line (history in the REPL). |
| `io.yield(item)` | Stream a typed item (NDJSON when headless). |
| `io.progress(label?)` | Transient status; `progress()` clears it. |
| `io.log(level, msg)` | stderr, only with `--verbose`. |
| `io.notify(notice)` | Structured MFA / tx-step notice (for `walletExecutor` flows). |
| `io.signal` | Abort on Ctrl-C / SIGINT. |
| `io.isInteractive` / `io.ask(...)` | Mid-command prompt. Gate with `if (io.isInteractive)`. |

### Inputs

Declare a schema once. `schemaToFlags` builds flags; `schemaToArgs` turns fields with `index` into oclif positionals (`mm ping Alice` and `--name Alice` both work). `io.resolveInputs` fills values.

```ts
const inputs = {
  name: {
    type: InputFieldType.Text,
    flag: "name",
    message: "Name to greet",
    required: false,
    prompt: false,
    index: 0, // `mm ping Alice` — requires `static args = schemaToArgs(inputs)`
  },
} satisfies InputSchema;
```

Field types: `Text`, `Password`, `Select`, `Confirm`, `Boolean`.

Useful field keys: `flag`, `message`, `required`, `prompt`, `index` (positional via `schemaToArgs`), `env`, `options` (select), `validate`, `when` (conditional).

### Permissions (`package.json#mm`)

Install-time consent is the real trust boundary. Plugins run **in-process and unsandboxed**. Runtime gates (`wallet-submit`, `mnemonic-read`) are defense-in-depth.

```json
{
  "mm": {
    "schemaVersion": 1,
    "minCliVersion": "^6.1.0",
    "capabilities": [],
    "commands": [
      {
        "id": "demo:balance",
        "capabilities": ["wallet-read"],
        "dataAccess": ["balances", "accounts"],
        "targetChains": "any"
      }
    ]
  }
}
```

| Field | Rule |
| --- | --- |
| `capabilities` (plugin-wide) | Keep `[]`. This list is merged into **every** command. |
| `commands[].capabilities` | Grant only what that command needs. |
| `commands[].dataAccess` | What you intend to read: `accounts`, `balances`, `prices`, `tokens`, `network`, `fees`, `swap-quotes`, `session`, `mnemonic`. |
| `commands[].targetChains` | `"any"` or a list of chain ids. |
| `minCliVersion` | Semver range against the installed `mm`. |

Capabilities:

| Capability | Grants |
| --- | --- |
| `wallet-read` | Read services (wallets, accounts, prices, tokens, fees, quotes). |
| `wallet-submit` | `ctx.walletExecutor()` — sign/submit, still policy-gated. |
| `mnemonic-read` | `ctx.mnemonicStore` (metadata, not the secret). |
| `config-write` | Reserved. |
| `network-manage` | Reserved. |

A command with no capabilities (this template’s `ping`) needs no auth and no wallet access.

Also required in `package.json`:

```json
{
  "keywords": ["oclif-plugin"],
  "peerDependencies": { "@metamask/agent-wallet": "^6" },
  "oclif": { "bin": "mm", "commands": "./dist/commands" }
}
```

## Sample commands

The folder is the command id. A file at `src/commands/ping.ts` is top-level (`mm ping`). A file at `src/commands/demo/balance.ts` is two-level (`mm demo balance` / id `demo:balance`). Same topic folder can hold several subs (`demo:balance` and `demo:submit`).

```
src/commands/
  ping.ts                 →  mm ping
  demo/balance.ts         →  mm demo balance   (demo:balance)
  demo/submit.ts          →  mm demo submit    (demo:submit)
  vault/mnemonic.ts       →  mm vault mnemonic (vault:mnemonic)
  admin/config.ts         →  mm admin config   (admin:config)
  admin/network.ts        →  mm admin network  (admin:network)
```

| Command | Capability | Notes |
| --- | --- | --- |
| `ping` | none | Flat id. No auth / init. `mm ping Alice` or `--name Alice`. |
| `demo:balance` | `wallet-read` | Topic + sub. Reads the active address and a recent tx count. |
| `demo:submit` | `wallet-submit` | Same `demo` topic, different sub. Obtains `ctx.walletExecutor`. |
| `vault:mnemonic` | `mnemonic-read` | Another topic. Reads mnemonic metadata only, never the secret. |
| `admin:config` | `config-write` | Reserved; shows how to declare the capability. |
| `admin:network` | `network-manage` | Same `admin` topic. Reserved. |

## Build

```bash
npm install
npm run build
npm run type-check
```

`dist/` and `oclif.manifest.json` are generated. Ship both in the package tarball (`files` in `package.json`). Type-check with `"moduleResolution": "Bundler"`.

## Install into mm

```bash
npm pack
mm plugins install file:./mm-plugin-hello-v0.0.1.tgz --accept-permissions
mm ping
```

Use interactive consent (omit `--accept-permissions`) when installing by hand.

```bash
mm plugins                  # list
mm plugins inspect <pkg>
mm plugins update
mm plugins uninstall <pkg>
```

See the host plugin-system docs in [MetaMask/agentic](https://github.com/MetaMask/agentic).
