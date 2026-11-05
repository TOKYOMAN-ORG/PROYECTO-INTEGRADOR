import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createInitialErrorBoundaryState,
  getDerivedErrorState,
  resetErrorState,
} from './error-boundary-model.ts';

describe('ErrorBoundary Model (SCRUM-72)', () => {
  it('crea el estado inicial sin error', () => {
    assert.deepEqual(createInitialErrorBoundaryState(), { hasError: false });
  });

  it('getDerivedErrorState actualiza el estado a hasError: true', () => {
    assert.deepEqual(getDerivedErrorState(), { hasError: true });
  });

  it('resetErrorState limpia hasError a false y ejecuta onReset', () => {
    let called = false;
    const nextState = resetErrorState(() => {
      called = true;
    });

    assert.equal(nextState.hasError, false);
    assert.equal(called, true);
  });
});
