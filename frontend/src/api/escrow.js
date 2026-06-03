import client from './client'

export const escrowApi = {
  freeze: (projectId) => client.post('/escrow/freeze', { project_id: projectId }),
}
