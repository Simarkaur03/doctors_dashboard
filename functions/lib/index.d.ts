interface CancellationRequest {
    appointmentId: string;
    patientId: string;
    slotId: string;
    doctorId: string;
}
export declare const cancelAppointment: import("firebase-functions/v2/https").CallableFunction<CancellationRequest, any, unknown>;
export declare const verifyAppointmentStatus: import("firebase-functions/v2/https").CallableFunction<{
    appointmentId: string;
}, any, unknown>;
export declare const cleanupOldCancelledAppointments: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
export {};
//# sourceMappingURL=index.d.ts.map