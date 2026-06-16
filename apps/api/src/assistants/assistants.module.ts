import { Module, OnModuleInit } from "@nestjs/common";
import { AssistantsController } from "./assistants.controller";
import { AssistantsService } from "./assistants.service";

@Module({
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
