import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { requireAdmin } from '@/lib/api/admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-4 pt-20 lg:ml-64 lg:p-6 lg:pt-6">
        {children}
      </main>
    </div>
  )
}
