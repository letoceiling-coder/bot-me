import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { InboxService } from "./inbox.service";

@Controller("inbox")
@UseGuards(JwtAuthGuard)
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get("conversations")
  list(@CurrentUser() user: { organizationId: string }) {
    return this.inbox.listConversations(user.organizationId);
  }

  @Get("conversations/:id/messages")
  messages(
    @CurrentUser() user: { organizationId: string },
    @Param("id") id: string,
  ) {
    return this.inbox.getMessages(user.organizationId, id);
  }
}
