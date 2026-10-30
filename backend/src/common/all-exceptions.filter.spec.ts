import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let logErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    logErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logErrorSpy.mockRestore();
  });

  function createHost(method = 'GET', url = '/api/test') {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ method, url }),
      }),
    } as any;
    return { host, status, json };
  }

  it('conserva el estado y cuerpo de una HttpException estándar (400, 401, 404)', () => {
    const { host, status, json } = createHost('POST', '/api/events');
    const exception = new HttpException(
      { statusCode: 400, message: ['title must be a string'], errors: { title: ['title must be a string'] } },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: ['title must be a string'],
      errors: { title: ['title must be a string'] },
    });
  });

  it('conserva el estado y cuerpo de una HttpException 503 (ServiceUnavailable)', () => {
    const { host, status, json } = createHost('GET', '/api/health');
    const exception = new HttpException(
      { statusCode: 503, message: 'Service Unavailable' },
      HttpStatus.SERVICE_UNAVAILABLE,
    );

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({ statusCode: 503, message: 'Service Unavailable' });
  });

  it('convierte un Error genérico inesperado en 500 genérico y registra en el servidor', () => {
    const { host, status, json } = createHost('GET', '/api/events');
    const exception = new Error('connect ECONNREFUSED 127.0.0.1:5432 at /home/app/repo.ts');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Error interno del servidor',
    });
    expect(logErrorSpy).toHaveBeenCalledTimes(1);
    expect(logErrorSpy.mock.calls[0][0]).toContain('connect ECONNREFUSED');
  });

  it('convierte una excepción que no es instancia de Error (throw "cadena") en 500 genérico', () => {
    const { host, status, json } = createHost('POST', '/api/events');
    const exception = 'fallo desconocido en memoria';

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Error interno del servidor',
    });
    expect(logErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('normaliza un SyntaxError de JSON malformado proveniente del body-parser a 400 limpio', () => {
    const { host, status, json } = createHost('POST', '/api/auth/login');
    const syntaxError = new SyntaxError('Unexpected token } in JSON at position 12');
    (syntaxError as any).status = 400;
    (syntaxError as any).body = '{"bad json}';

    filter.catch(syntaxError, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Sintaxis JSON inválida',
    });
  });
});
