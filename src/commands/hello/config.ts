import { type CommandIO, PluginCommand } from "@metamask/agent-wallet/plugin";

export default class HelloConfigCommand extends PluginCommand<{ capability: "config-write"; status: "reserved" }> {
  static override requiresAuth = false;
  static override requiresInit = false;
  static override description = "Example plugin: config-write capability (reserved for future config mutations)";
  protected readonly pluginCommandId = "hello:config";

  async execute(_io: CommandIO) {
    // `config-write` is reserved: no runtime API is gated on it yet. This command
    // only shows how to declare the capability in package.json#mm.
    return { capability: "config-write" as const, status: "reserved" as const };
  }
}
