# Agent Wallet plugin template

Starter for a third-party [`mm`](https://github.com/MetaMask/agentic) CLI plugin. Commands extend `PluginCommand` from `@metamask/agent-wallet/plugin` and declare permissions in `package.json#mm`.

## Commands

| Command | Capability | Notes |
| --- | --- | --- |
| `hello ping` | none | No auth / init. Demonstrates `schemaToFlags` + `io.resolveInputs`. |
| `hello balance` | `wallet-read` | Reads the active address and a recent tx count. |
| `hello submit` | `wallet-submit` | Obtains `ctx.walletExecutor` (still policy-gated). |
| `hello mnemonic` | `mnemonic-read` | Reads mnemonic metadata only, never the secret. |
| `hello config` | `config-write` | Reserved; shows how to declare the capability. |
| `hello network` | `network-manage` | Reserved; shows how to declare the capability. |

## Build

```bash
yarn
yarn build
```

`dist/` and `oclif.manifest.json` are generated. Ship both in the package tarball (`files` in `package.json`). Type-check with `"moduleResolution": "Bundler"`.

## Install into mm

```bash
yarn pack
mm plugins install file:./mm-plugin-hello-v0.0.1.tgz --accept-permissions
mm hello ping
```

Use interactive consent (omit `--accept-permissions`) when installing by hand.

## Authoring

- Implement only `execute`. Auth/init/fees, analytics, and rendering are sealed on `PluginCommand`.
- Set `requiresAuth` / `requiresInit` as static fields. Do not override sealed lifecycle methods.
- Base flags (`--format`, `--json`, `--toon`, `--verbose`) are inherited; declare only your own flags.
- Keep plugin-wide `mm.capabilities` empty and grant per command so you do not over-share.

See the mm plugin-system docs in [MetaMask/agentic](https://github.com/MetaMask/agentic).
