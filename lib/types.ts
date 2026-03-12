export interface Doctor {
  id: number;
  name: string;
  email: string;
  token: string;
  doctor_group: 'substitute_available' | 'request_only';
  active: number;
  created_at: string;
}

export interface SubRequest {
  id: number;
  requester_id: number;
  request_date: string;
  institution: string;
  start_time: string;
  end_time: string;
  work_type: string;
  salary: string;
  is_department_related: number;
  notes: string;
  status: string;
  created_at: string;
}

export interface SubResponse {
  id: number;
  request_id: number;
  responder_id: number;
  has_experience: number;
  questions: string;
  created_at: string;
}
