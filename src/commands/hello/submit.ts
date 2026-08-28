import { type CommandIO, PluginCommand } from "@metamask/agent-wallet/plugin";

export default class HelloSubmitCommand extends PluginCommand<{ walletSubmit: "granted" }> {
  static override requiresAuth = true;
  static override description = "Example plugin: obtain the wallet executor (capability: wallet-submit)";
  protected readonly pluginCommandId = "hello:submit";

  async execute(io: CommandIO) {
    // `ctx.walletExecutor` is gated by the `wallet-submit` capability: without it
    // the host returns a stub that throws PERMISSION_DENIED. Obtaining the executor
    // proves access — a real command would then call it with a WalletIntent to
    // sign/submit (still routed through MetaMask policy).
    await this.ctx.walletExecutor(io, this.pluginCommandId);
    return { walletSubmit: "granted" as const };
  }
}
