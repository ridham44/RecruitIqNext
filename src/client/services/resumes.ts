import { api } from './api';

export const resumesApi = {
  list: () => api.get('/resumes'),
  upload: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.upload('/resumes', formData);
  },
};
