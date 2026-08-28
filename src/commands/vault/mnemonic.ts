import { type CommandIO, PluginCommand } from "@metamask/agent-wallet/plugin";

export default class HelloMnemonicCommand extends PluginCommand<{ encrypted: boolean }> {
  static override requiresAuth = false;
  static override requiresInit = false;
  static override description = "Example plugin: read mnemonic metadata (capability: mnemonic-read)";
  protected readonly pluginCommandId = "vault:mnemonic";

  async execute(_io: CommandIO) {
    // `ctx.mnemonicStore` is gated by the `mnemonic-read` capability (accessing it
    // without the grant throws PERMISSION_DENIED). Read only metadata here — never
    // the secret itself.
    return { encrypted: this.ctx.mnemonicStore.isEncrypted() };
  }
}
