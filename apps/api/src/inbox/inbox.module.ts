import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { IntegrationsModule } from "../integrations/integrations.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { InboxController } from "./inbox.controller";
import { InboxService } from "./inbox.service";

@Module({
  imports: [IntegrationsModule, AdminModule, NotificationsModule],
  controllers: [InboxController],
  providers: [InboxService],
})
export class InboxModule {}
