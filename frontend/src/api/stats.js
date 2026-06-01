import client from './client'

export const statsApi = {
  getGlobal: () => client.get('/stats/global'),
  getUserLocations: () => client.get('/stats/users-locations'),
  getRecentProjects: () => client.get('/stats/recent-projects'),
  getTopFreelancers: () => client.get('/stats/top-freelancers'),
  getOnlineCount: () => client.get('/stats/online-count'),
}
