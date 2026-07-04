import { readFileSync } from 'fs';
import { resolve } from 'path';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { assertSucceeds, assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing';

const projectId = 'doctor-dashboard-test';
const rules = readFileSync(resolve(__dirname, '../../../firestore.rules'), 'utf8');

describe('Firestore security rules', () => {
  let testEnv: Awaited<ReturnType<typeof initializeTestEnvironment>>;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules,
      },
    });
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  it('allows a patient to create their own user document without custom role claims', async () => {
    const patient = testEnv.authenticatedContext('patient-1', { email_verified: true });

    await assertSucceeds(
      patient.firestore().doc('users/patient-1').set({
        uid: 'patient-1',
        email: 'patient@example.com',
        role: 'patient',
      })
    );
  });

  it('blocks a patient from creating another user document', async () => {
    const patient = testEnv.authenticatedContext('patient-1', { email_verified: true });

    await assertFails(
      patient.firestore().doc('users/patient-2').set({
        uid: 'patient-2',
        email: 'other@example.com',
        role: 'patient',
      })
    );
  });
});
