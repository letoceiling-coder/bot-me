import { Module } from "@nestjs/common";
import { TariffsPublicController } from "./tariffs-public.controller";

@Module({
  controllers: [TariffsPublicController],
})
export class TariffsModule {}
