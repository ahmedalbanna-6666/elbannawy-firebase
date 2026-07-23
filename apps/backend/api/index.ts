import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "../dist/src/app.module";

let cachedApp: Express.Application;

async function bootstrap() {
  const express = await import("express");
  const server = express.default();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ["error", "warn", "log"],
  });

  app.setGlobalPrefix("api/v1");
  app.enableCors({ origin: "*", credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return server;
}

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  cachedApp(req, res);
}
