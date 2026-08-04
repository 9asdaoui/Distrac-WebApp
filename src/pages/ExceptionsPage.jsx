import React from 'react'
import { Plus } from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'

export function ExceptionsPage() {
  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-cc-surface md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Exceptions</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Monitor and resolve operational exceptions.</p>
            </div>
            <button type="button" className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Exception
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Type</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Source</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={3}>
                      No exceptions found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}
