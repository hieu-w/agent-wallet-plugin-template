import { type CommandIO, PluginCommand } from "@metamask/agent-wallet/plugin";

// Path src/commands/demo/balance.ts → CLI `mm demo balance` / id `demo:balance`.
export default class HelloBalanceCommand extends PluginCommand<{ address: string; balanceWei: string; txCount: number }> {
  static override requiresAuth = true;
  static override description = "Example plugin: show the active address, on-chain balance, and tx count";
  protected readonly pluginCommandId = "demo:balance";

  async execute(_io: CommandIO) {
    // The restricted plugin context only exposes the services declared in the
    // manifest's capabilities — here `wallet-read` grants `walletStateManager`,
    // `accountService`, and `publicClient(chainId)` for raw EVM reads.
    const state = this.ctx.walletStateManager.read();
    const address = [...state.byokWallets, ...state.remoteWallets][0]?.address ?? "";
    if (!address) {
      return { address, balanceWei: "0", txCount: 0 };
    }

    const client = this.ctx.publicClient(1); // Ethereum mainnet
    const [balanceWei, txCount] = await Promise.all([
      client.getBalance({ address: address as `0x${string}` }),
      client.getTransactionCount({ address: address as `0x${string}` }),
    ]);

    return { address, balanceWei: balanceWei.toString(), txCount };
  }
}
