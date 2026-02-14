import http from '../../../services/http';

export interface Company {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const companiesApi = {
  getAll: () => http.get<Company[]>('/companies'),
  getById: (id: string) => http.get<Company>(`/companies/${id}`),
  create: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => 
    http.post<Company>('/companies', company),
  update: (id: string, company: Company) => 
    http.put(`/companies/${id}`, company),
  delete: (id: string) => http.delete(`/companies/${id}`),
};
