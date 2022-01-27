import { Module } from "@nestjs/common";
import { NecordModule } from "necord";
import { DiscordService } from "./discord.service";
import { NestjsDocumentationAutocomplete } from "./nestjs.autocomplete";

@Module({
  providers: [DiscordService, NestjsDocumentationAutocomplete],
  imports: [
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN,
      intents: [],
      // If set, it will set all commands to be guild commands
      // They update much faster, therefore are used for development.
      development:
        process.env.NODE_ENV === "development"
          ? [process.env.DISCORD_HOME_SERVER_ID]
          : [],
    }),
  ],
})
export class DiscordModule {}
