import { Module } from "@nestjs/common";
import { IntegrationsModule } from "../integrations/integrations.module";
import { InboxController } from "./inbox.controller";
import { InboxService } from "./inbox.service";

@Module({
  imports: [IntegrationsModule],
  controllers: [InboxController],
  providers: [InboxService],
})
export class InboxModule {}
