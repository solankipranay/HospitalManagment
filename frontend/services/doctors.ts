import api from "./api";

export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  specialty: string;
  consultation_duration: number;
  availability: DayAvailability[];
}

export interface DayAvailability {
  day: string;
  start_time: string;
  end_time: string;
  breaks: { start: string; end: string }[];
  is_available: boolean;
}

export interface SlotsResponse {
  doctor_id: string;
  date: string;
  consultation_duration: number;
  slots: string[];
}

export const doctorsService = {
  list: (specialty?: string) =>
    api
      .get<Doctor[]>("/doctors", { params: specialty ? { specialty } : {} })
      .then((r) => r.data),

  getById: (id: string) => api.get<Doctor>(`/doctors/${id}`).then((r) => r.data),

  getSlots: (doctorId: string, date: string) =>
    api
      .get<SlotsResponse>(`/doctors/${doctorId}/slots`, { params: { date } })
      .then((r) => r.data),

  getMyProfile: () => api.get<Doctor>("/doctors/me").then((r) => r.data),

  updateProfile: (data: {
    specialty?: string;
    consultation_duration?: number;
    availability?: DayAvailability[];
  }) => api.put("/doctors/me/profile", data).then((r) => r.data),
};
