import api from "./api";

export type AppointmentStatus =
  | "Scheduled"
  | "In_Progress"
  | "Completed"
  | "Cancelled";

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  doctor_name: string;
  patient_name: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  diagnosis?: string;
  created_at: string;
  auto_assigned: boolean;
}

export const appointmentsService = {
  book: (doctor_id: string, start_time: string) =>
    api.post("/appointments", { doctor_id, start_time }).then((r) => r.data),

  mine: () => api.get<Appointment[]>("/appointments/me").then((r) => r.data),

  cancel: (id: string) =>
    api.delete(`/appointments/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: AppointmentStatus) =>
    api.put(`/appointments/${id}/status`, { status }).then((r) => r.data),

  updateNotes: (id: string, notes: string, diagnosis: string) =>
    api
      .put(`/appointments/${id}/notes`, { notes, diagnosis })
      .then((r) => r.data),
};
