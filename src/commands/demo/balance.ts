import { type CommandIO, PluginCommand } from "@metamask/agent-wallet/plugin";

// Path src/commands/demo/balance.ts → CLI `mm demo balance` / id `demo:balance`.
export default class HelloBalanceCommand extends PluginCommand<{ address: string; txCount: number }> {
  static override requiresAuth = true;
  static override description = "Example plugin: show the active address and its recent tx count";
  protected readonly pluginCommandId = "demo:balance";

  async execute(_io: CommandIO) {
    // The restricted plugin context only exposes the services declared in the
    // manifest's capabilities — here `wallet-read` grants `walletStateManager`
    // and `accountService`.
    const state = this.ctx.walletStateManager.read();
    const address = [...state.byokWallets, ...state.remoteWallets][0]?.address ?? "";
    if (!address) {
      return { address, txCount: 0 };
    }
    const txns = await this.ctx.accountService.getMultiAccountTransactions({ accountIds: [`eip155:1:${address}`] });
    return { address, txCount: txns.data.length };
  }
}
