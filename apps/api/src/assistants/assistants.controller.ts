import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { AssistantsService } from "./assistants.service";
import { CreateAssistantDto, UpdateAssistantDto } from "./assistants.dto";
import { TestChatDto } from "./test-chat.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class AssistantsController {
  constructor(private readonly assistants: AssistantsService) {}

  @Get("tools")
  listTools() {
    return this.assistants.listTools();
  }

  @Get("presets")
  listPresets() {
    return this.assistants.listPresets();
  }

  @Get("assistants")
  list(@CurrentUser() user: { organizationId: string }) {
    return this.assistants.list(user.organizationId);
  }

  @Post("assistants")
  create(
    @CurrentUser() user: { organizationId: string },
    @Body() body: CreateAssistantDto,
  ) {
    return this.assistants.create(user.organizationId, body);
  }

  @Post("assistants/:id/test-chat")
  testChat(
    @CurrentUser() user: { organizationId: string },
    @Param("id") id: string,
    @Body() body: TestChatDto,
  ) {
    return this.assistants.testChat(user.organizationId, id, body);
  }

  @Get("assistants/:id")
  get(
    @CurrentUser() user: { organizationId: string },
    @Param("id") id: string,
  ) {
    return this.assistants.get(user.organizationId, id);
  }

  @Get("assistants/:id/prompt-preview")
  preview(
    @CurrentUser() user: { organizationId: string },
    @Param("id") id: string,
  ) {
    return this.assistants.previewPrompt(user.organizationId, id);
  }

  @Patch("assistants/:id")
  update(
    @CurrentUser() user: { organizationId: string },
    @Param("id") id: string,
    @Body() body: UpdateAssistantDto,
  ) {
    return this.assistants.update(user.organizationId, id, body);
  }

  @Delete("assistants/:id")
  remove(
    @CurrentUser() user: { organizationId: string },
    @Param("id") id: string,
  ) {
    return this.assistants.remove(user.organizationId, id);
  }
}
