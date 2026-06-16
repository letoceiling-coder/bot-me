import { Module, OnModuleInit } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { AssistantsController } from "./assistants.controller";
import { AssistantsService } from "./assistants.service";

@Module({
  imports: [AdminModule, KnowledgeModule],
  controllers: [AssistantsController],
  providers: [AssistantsService],
  exports: [AssistantsService],
})
export class AssistantsModule implements OnModuleInit {
  constructor(private readonly assistants: AssistantsService) {}

  async onModuleInit() {
    await this.assistants.syncRegistry();
  }
}
