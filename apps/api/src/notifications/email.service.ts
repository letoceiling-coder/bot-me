import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>("SMTP_HOST");
    if (!host) {
      this.transporter = null;
      return;
    }

    const port = Number(config.get<string>("SMTP_PORT") ?? 587);
    const user = config.get<string>("SMTP_USER");
    const pass = config.get<string>("SMTP_PASS");

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: config.get<string>("SMTP_SECURE") === "true" || port === 465,
      auth: user ? { user, pass } : undefined,
    });
  }

  isConfigured() {
    return Boolean(this.transporter);
  }

  async send(to: string, subject: string, text: string) {
    if (!this.transporter) return false;

    const from =
      this.config.get<string>("SMTP_FROM") ?? "botme <noreply@bot-me.neeklo.ru>";

    try {
      await this.transporter.sendMail({ from, to, subject, text });
      return true;
    } catch (err) {
      this.logger.warn(
        `SMTP send failed for ${to}: ${err instanceof Error ? err.message : "error"}`,
      );
      return false;
    }
  }
}
