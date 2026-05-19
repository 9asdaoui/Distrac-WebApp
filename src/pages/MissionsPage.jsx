import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'

export function MissionsPage() {
  return (
    <DashboardLayout>
      <AnimatedPage>
        <div>
          <h1 className="text-3xl font-bold text-distrac-dark mb-4">Missions</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Missions interface coming soon...</p>
          </div>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}
