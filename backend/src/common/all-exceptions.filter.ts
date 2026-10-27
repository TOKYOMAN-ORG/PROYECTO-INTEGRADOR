import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (status >= 500) {
        this.logger.error(
          `HttpException ${status} ${request.method} ${request.url}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      }

      if (status >= 500) {
        response.status(status).json({
          statusCode: status,
          error: 'Internal Server Error',
          message: 'Ocurrió un error inesperado',
        });
        return;
      }

      // For client errors (4xx), preserve Nest's response shape when it's an object,
      // otherwise wrap it. But we must not leak internals.
      if (typeof exceptionResponse === 'string') {
        response.status(status).json({
          statusCode: status,
          error: exception.name,
          message: exceptionResponse,
        });
        return;
      }

      // Keep the exceptionResponse as-is for known 4xx (validation etc.)
      response.status(status).json(exceptionResponse);
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    this.logger.error(
      `Unhandled exception ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      error: 'Internal Server Error',
      message: 'Ocurrió un error inesperado',
    });
  }
}
