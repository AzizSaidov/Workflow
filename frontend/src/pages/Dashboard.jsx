import useAuthStore from '../store/authStore'
import DashboardClient from './DashboardClient'
import DashboardFreelancer from './DashboardFreelancer'

export default function Dashboard() {
  const user = useAuthStore(s => s.user)

  if (user?.role === 'client') return <DashboardClient />
  if (user?.role === 'freelancer') return <DashboardFreelancer />

  return <DashboardClient />
}
