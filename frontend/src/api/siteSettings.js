import client from './client'

export const siteSettingsApi = {
  getPublic:      () => client.get('/settings/public'),
  getAdmin:       () => client.get('/admin/settings/'),
  toggleHoliday:  () => client.post('/admin/settings/holiday-mode/toggle'),
}
