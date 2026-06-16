import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'
import { ExecutiveHomeContent } from '../components/dashboard/ExecutiveHomeContent'

export function DashboardHome() {
  return (
    <DashboardLayout>
      <AnimatedPage>
        <ExecutiveHomeContent />
      </AnimatedPage>
    </DashboardLayout>
  )
}
