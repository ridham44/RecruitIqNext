import { api } from './api';

export const screeningApi = {
  runForJob: (jobId, force = false) => api.post(`/screening/job/${jobId}/run`, force ? { force: true } : undefined),
  runForApplication: (applicationId) => api.post(`/screening/application/${applicationId}/run`),
  getRanked: (jobId) => api.get(`/screening/job/${jobId}/ranked`),
  getTop10: (jobId) => api.get(`/screening/job/${jobId}/top`),
};
