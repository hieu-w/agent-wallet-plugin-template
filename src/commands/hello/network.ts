import { type CommandIO, PluginCommand } from "@metamask/agent-wallet/plugin";

export default class HelloNetworkCommand extends PluginCommand<{ capability: "network-manage"; status: "reserved" }> {
  static override requiresAuth = false;
  static override requiresInit = false;
  static override description = "Example plugin: network-manage capability (reserved for future network management)";
  protected readonly pluginCommandId = "hello:network";

  async execute(_io: CommandIO) {
    // `network-manage` is reserved: no runtime API is gated on it yet. This command
    // only shows how to declare the capability in package.json#mm.
    return { capability: "network-manage" as const, status: "reserved" as const };
  }
}
