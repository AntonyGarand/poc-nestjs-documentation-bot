import { Injectable, Logger } from "@nestjs/common";
import { CommandInteraction, MessageEmbed } from "discord.js";
import {
  Autocomplete,
  Context,
  ContextOf,
  On,
  Once,
  Options,
  SlashCommand,
  StringOption,
} from "necord";
import {
  NestjsDocumentationAutocomplete,
  NestjsDocumentationSections,
} from "./nestjs.autocomplete";

class DocDTO {
  @StringOption({
    name: "doc",
    description: "Documentation section",
    required: true,
    autocomplete: true,
  })
  // Will be the item id if an autocomple option was picked
  // And the entered string otherwise
  documentation: string;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  @Once("ready")
  public onReady(@Context() [client]: ContextOf<"ready">) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }

  @On("warn")
  public onWarn(@Context() [message]: ContextOf<"warn">) {
    this.logger.warn(message);
  }

  @SlashCommand("ping", "Ping Command")
  public async onPing(@Context() [interaction]: [CommandInteraction]) {
    return interaction.reply({ content: "Pong!" });
  }

  @Autocomplete(NestjsDocumentationAutocomplete)
  @SlashCommand("doc", "Find something in the nestjs documentation")
  public async onDoc(
    @Context() [interaction]: [CommandInteraction],
    @Options() dto: DocDTO
  ) {
    const result = NestjsDocumentationSections.find(
      (v) => v.title === dto.documentation
    );
    const embed = new MessageEmbed()
      .setTitle("NestJS documentation: " + result.title)
      .setURL(result.url)
      .setDescription(result.content.slice(0, 4000));
    return interaction.reply({ embeds: [embed] });
  }
}
