import { Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string; organizationId: string }) {
    return this.notifications.list(user.organizationId, user.userId);
  }

  @Patch(":id/read")
  markRead(
    @CurrentUser() user: { userId: string; organizationId: string },
    @Param("id") id: string,
  ) {
    return this.notifications.markRead(user.organizationId, user.userId, id);
  }

  @Post("read-all")
  markAllRead(@CurrentUser() user: { userId: string; organizationId: string }) {
    return this.notifications.markAllRead(user.organizationId, user.userId);
  }
}
