import { readFileSync } from 'fs';
import { resolve } from 'path';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { assertSucceeds, assertFails, initializeTestEnvironment } from '@firebase/rules-unit-testing';

const projectId = 'doctor-dashboard-test';
const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8');

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
    const patient = testEnv.authenticatedContext('patient-1');

    await assertSucceeds(
      patient.firestore().doc('users/patient-1').set({
        uid: 'patient-1',
        email: 'patient@example.com',
        role: 'patient',
      })
    );
  });

  it('blocks a patient from creating another user document', async () => {
    const patient = testEnv.authenticatedContext('patient-1');

    await assertFails(
      patient.firestore().doc('users/patient-2').set({
        uid: 'patient-2',
        email: 'other@example.com',
        role: 'patient',
      })
    );
  });

  it('allows a patient to read their own profile immediately after signup', async () => {
    const patient = testEnv.authenticatedContext('patient-3');

    await assertSucceeds(
      patient.firestore().doc('users/patient-3').set({
        uid: 'patient-3',
        email: 'patient3@example.com',
        role: 'patient',
      })
    );

    await assertSucceeds(patient.firestore().doc('users/patient-3').get());
  });

  it('allows a doctor to create a slot with no custom role claim on the auth token', async () => {
    // role() must fall back to the Firestore user doc's role via get()
    // rather than dot-accessing the (usually absent) auth.token.role claim,
    // which throws instead of returning null.
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('users/doctor-1').set({ uid: 'doctor-1', email: 'doc@example.com', role: 'doctor' });
    });

    const doctor = testEnv.authenticatedContext('doctor-1');

    await assertSucceeds(
      doctor.firestore().doc('slots/doctor-1_2030-01-01_09:00').set({
        doctorId: 'doctor-1',
        doctorName: 'Dr. Test',
        date: '2030-01-01',
        time: '09:00',
        duration: 30,
        status: 'available',
      })
    );
  });

  it('blocks a doctor from taking over another doctor\'s existing slot', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('users/doctor-2').set({ uid: 'doctor-2', email: 'doc2@example.com', role: 'doctor' });
      await context.firestore().doc('slots/doctor-1_2030-01-02_09:00').set({
        doctorId: 'doctor-1',
        doctorName: 'Dr. Test',
        date: '2030-01-02',
        time: '09:00',
        duration: 30,
        status: 'available',
      });
    });

    const doctor2 = testEnv.authenticatedContext('doctor-2');

    await assertFails(
      doctor2.firestore().doc('slots/doctor-1_2030-01-02_09:00').update({
        doctorId: 'doctor-2',
        status: 'unavailable',
      })
    );
  });

  it('blocks an unauthenticated request from reading a user document', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('users/patient-4').set({ uid: 'patient-4', email: 'patient4@example.com', role: 'patient' });
    });

    const anon = testEnv.unauthenticatedContext();
    await assertFails(anon.firestore().doc('users/patient-4').get());
  });
});
