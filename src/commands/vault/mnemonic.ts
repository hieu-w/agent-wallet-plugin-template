import { type CommandIO, PluginCommand } from "@metamask/agent-wallet/plugin";

export default class HelloMnemonicCommand extends PluginCommand<{ capability: "mnemonic-read"; status: "reserved" }> {
  static override requiresAuth = false;
  static override requiresInit = false;
  static override description = "Example plugin: mnemonic-read capability (reserved; SRP is host-only)";
  protected readonly pluginCommandId = "vault:mnemonic";

  async execute(_io: CommandIO) {
    // `mnemonic-read` is reserved: `ctx.mnemonicStore` is never exposed to plugins
    // (the secret recovery phrase is host-only). This command only shows how to
    // declare the capability in package.json#mm.
    return { capability: "mnemonic-read" as const, status: "reserved" as const };
  }
}
