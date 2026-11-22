import api from "./api";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export interface WaitlistEntry {
  id: string;
  doctor_id: string;
  doctor_name: string;
  preferred_date: string;
  urgency_level: UrgencyLevel;
  priority: number;
  status: string;
  created_at: string;
}

export const waitlistService = {
  join: (doctor_id: string, preferred_date: string, urgency_level: UrgencyLevel) =>
    api
      .post("/waitlist", { doctor_id, preferred_date, urgency_level })
      .then((r) => r.data),

  mine: () => api.get<WaitlistEntry[]>("/waitlist/me").then((r) => r.data),

  leave: (id: string) => api.delete(`/waitlist/${id}`).then((r) => r.data),
};
