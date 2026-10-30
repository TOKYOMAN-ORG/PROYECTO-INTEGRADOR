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

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. Manejo de excepciones HTTP controladas (4xx, 503, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Normalizar errores del analizador de JSON que puedan venir en BadRequestException
      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse &&
        typeof (exceptionResponse as Record<string, unknown>).message === 'string' &&
        /JSON|Unexpected token/i.test((exceptionResponse as Record<string, unknown>).message as string)
      ) {
        response.status(status).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Sintaxis JSON inválida',
        });
        return;
      }

      if (typeof exceptionResponse === 'string') {
        response.status(status).json({
          statusCode: status,
          message: exceptionResponse,
        });
        return;
      }

      response.status(status).json(exceptionResponse);
      return;
    }

    // 2. Errores del parser de JSON de Express (SyntaxError de body-parser)
    if (
      exception instanceof SyntaxError &&
      'status' in exception &&
      (exception as Record<string, unknown>).status === 400 &&
      'body' in exception
    ) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Sintaxis JSON inválida',
      });
      return;
    }

    // 3. Cualquier otra excepción inesperada -> 500 genérico sin datos internos
    const stack = exception instanceof Error ? exception.stack : undefined;
    const errorMessage =
      exception instanceof Error
        ? exception.message
        : typeof exception === 'string'
          ? exception
          : JSON.stringify(exception);

    this.logger.error(
      `Unhandled exception ${request?.method ?? ''} ${request?.url ?? ''}: ${errorMessage}`,
      stack,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
    });
  }
}
