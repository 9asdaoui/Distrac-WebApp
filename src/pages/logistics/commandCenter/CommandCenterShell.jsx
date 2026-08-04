import React from 'react'
import { useTranslation } from 'react-i18next'
import { WialonLinkModal } from '../../../components/logistics/WialonLinkModal'
import { MapMobileBottomSheet } from '../../../components/map/MapMobileBottomSheet'
import { CcMissionFiltersProvider } from '../../../components/map/CcMissionFiltersContext'
import { EditToast } from '../globalMap/GlobalMapPanels'

export function CommandCenterShell({
  missionPeriod,
  onMissionPeriodChange,
  missionDate,
  onMissionDateChange,
  depotId,
  onDepotChange,
  missionStatus,
  onMissionStatusChange,
  mapColumn,
  railPanel,
  railOpen,
  onRailClose,
  toast,
  onToastClose,
  wialonLinkVehicle,
  onWialonClose,
  onWialonLinked,
}) {
  const { t } = useTranslation()

  return (
    <CcMissionFiltersProvider
      period={missionPeriod}
      onPeriodChange={onMissionPeriodChange}
      date={missionPeriod === undefined ? missionDate : undefined}
      onDateChange={missionPeriod === undefined ? onMissionDateChange : undefined}
      depotId={depotId}
      onDepotChange={onDepotChange}
      status={missionStatus}
      onStatusChange={onMissionStatusChange}
    >
      <div className="relative flex h-full min-h-0 w-full gap-3 overflow-hidden bg-cc-bg p-3">
        {mapColumn}

        <div className="hidden h-full min-w-0 flex-1 flex-col overflow-hidden lg:flex lg:w-[58%]">
          {railPanel}
        </div>

        <MapMobileBottomSheet open={railOpen} onClose={onRailClose} title={t('sidebar.commandCenter')}>
          {railPanel}
        </MapMobileBottomSheet>

        <EditToast message={toast} onClose={onToastClose} />
        {wialonLinkVehicle && (
          <WialonLinkModal
            vehicle={wialonLinkVehicle}
            onClose={onWialonClose}
            onLinked={onWialonLinked}
          />
        )}
      </div>
    </CcMissionFiltersProvider>
  )
}
