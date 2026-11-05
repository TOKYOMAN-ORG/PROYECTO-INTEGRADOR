import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import {
  handleUncaughtError,
  handleUnhandledRejection,
  installGlobalErrorHandlers,
  resetGlobalErrorHandlersInstalledForTest,
} from './global-error-handler.ts';
import { resetReportErrorHistory } from './report-error.ts';

describe('global-error-handler (SCRUM-73)', () => {
  let logged: string[] = [];
  const originalError = console.error;

  beforeEach(() => {
    logged = [];
    resetReportErrorHistory();
    resetGlobalErrorHandlersInstalledForTest();
    console.error = (...args: unknown[]) => {
      logged.push(args.join(' '));
    };
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('handleUncaughtError reporta errores no capturados omitiendo datos sensibles', () => {
    const error = new Error('Fallo en timer asíncrono con Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.abc');
    handleUncaughtError(error, false);

    assert.equal(logged.length, 1);
    assert.ok(logged[0].includes('Fallo en timer asíncrono'));
    assert.ok(!logged[0].includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
  });

  it('handleUnhandledRejection reporta promesas rechazadas', () => {
    const reason = new Error('Network timeout in background fetch');
    handleUnhandledRejection(reason);

    assert.equal(logged.length, 1);
    assert.ok(logged[0].includes('Network timeout in background fetch'));
  });

  it('installGlobalErrorHandlers es idempotente y no lanza si se invoca múltiples veces', () => {
    assert.doesNotThrow(() => {
      installGlobalErrorHandlers();
      installGlobalErrorHandlers();
    });
  });
});
