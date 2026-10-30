import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import {
  reportError,
  resetReportErrorHistory,
  sanitizeErrorMessage,
} from './report-error.ts';

describe('reportError (SCRUM-72)', () => {
  let logged: string[] = [];
  const originalError = console.error;

  beforeEach(() => {
    logged = [];
    resetReportErrorHistory();
    console.error = (...args: unknown[]) => {
      logged.push(args.join(' '));
    };
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('omite tokens JWT en los mensajes de error registrados', () => {
    const raw = 'Fallo con token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.abcde12345 y más';
    const sanitized = sanitizeErrorMessage(raw);
    assert.ok(!sanitized.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
    assert.ok(sanitized.includes('[REDACTED]'));
  });

  it('omite contraseñas y cabeceras de autorización en el reporte', () => {
    const raw = 'Payload: {"email":"user@test.com", "password":"MiSuperPassword123"} Bearer eyJ123.456.789';
    const sanitized = sanitizeErrorMessage(raw);
    assert.ok(!sanitized.includes('MiSuperPassword123'));
    assert.ok(!sanitized.includes('Bearer eyJ123.456.789'));
  });

  it('registra el error en consola una sola vez ante llamadas duplicadas consecutivas', () => {
    reportError(new Error('Fallo temporal de render'));
    reportError(new Error('Fallo temporal de render'));

    assert.equal(logged.length, 1);
    assert.ok(logged[0].includes('Fallo temporal de render'));
  });

  it('soporta errores lanzados como cadenas o valores no estándar', () => {
    reportError('String error direct');
    assert.equal(logged.length, 1);
    assert.ok(logged[0].includes('String error direct'));
  });
});
