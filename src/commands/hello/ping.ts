import { type CommandIO, InputFieldType, type InputSchema, PluginCommand, schemaToFlags } from "@metamask/agent-wallet/plugin";

// Declarative inputs, resolved the same way host commands do: flags + positionals
// + interactive prompts. `schemaToFlags` builds the oclif flags; `io.resolveInputs`
// (provided by the host) reads/validates/prompts them at execute time.
const inputs = {
  name: {
    type: InputFieldType.Text,
    flag: "name",
    message: "Name to greet",
    required: false,
    prompt: false,
    index: 0,
  },
} satisfies InputSchema;

export default class HelloPingCommand extends PluginCommand<{ message: string }> {
  // No session and no `mm init` needed — runs for anyone with the plugin installed.
  static override requiresAuth = false;
  static override requiresInit = false;
  static override description = "Example plugin: greet without auth (demonstrates the input schema)";
  // Base flags (--format/--json/--toon/--verbose) are inherited from the host
  // Command base class; only declare your own here.
  static override flags = schemaToFlags(inputs);
  protected readonly pluginCommandId = "hello:ping";

  async execute(io: CommandIO) {
    const { name } = await io.resolveInputs(inputs);
    return { message: name ? `pong, ${name}` : "pong" };
  }
}
