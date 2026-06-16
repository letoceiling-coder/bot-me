import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { InboxService } from "./inbox.service";
import { InboxReplyDto } from "./inbox.dto";

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
    @CurrentUser() user: { userId: string; organizationId: string },
    @Param("id") id: string,
  ) {
    return this.inbox.getMessages(user.organizationId, id, user.userId);
  }

  @Post("conversations/:id/takeover")
  takeover(
    @CurrentUser() user: { userId: string; organizationId: string },
    @Param("id") id: string,
  ) {
    return this.inbox.takeover(user.organizationId, id, user.userId);
  }

  @Post("conversations/:id/release")
  release(
    @CurrentUser() user: { organizationId: string },
    @Param("id") id: string,
  ) {
    return this.inbox.release(user.organizationId, id);
  }

  @Post("conversations/:id/reply")
  reply(
    @CurrentUser() user: { organizationId: string },
    @Param("id") id: string,
    @Body() body: InboxReplyDto,
  ) {
    return this.inbox.reply(user.organizationId, id, body.content);
  }
}
