import React from 'react'
import { MapAdminRailPanel } from '../../../components/map/MapLayerRailPanels'
import { MapHomeSidePanel } from '../../../components/dashboard/MapHomeSidePanel'
import { CcPanelHost } from '../../../components/map/CcPanelHost'
import { CommandCenterRailShell } from '../../../components/dashboard/depotOps/CommandCenterRailShell'
import {
  buildGlobalMapPanelHref,
  isMapAdminPanel,
} from '../../../components/map/ccPanelRegistry'
import {
  DetailPanel,
  IndustryCreateRail,
  RegionCreateRail,
} from '../globalMap/GlobalMapPanels'

export function RightRailRouter({
  isCreatingRegion,
  isCreatingIndustry,
  createSession,
  showEntityDetail,
  showErpPanel,
  panelState,
  hasPermission,
  editSession,
  selectedElement,
  regions,
  vehicles,
  canManageLogistics,
  canEditMapEntity,
  canCreateMapEntity = true,
  canUpdateClientCredit,
  mapLayerSearch,
  isLoading,
  refreshMapData,
  onSelect,
  onNavigate,
  followVehicleId,
  setFollowVehicleId,
  setWialonLinkVehicle,
  depotId,
  onDepotChange,
  missionPeriod,
  onPeriodChange,
  onMapLayerSearchChange,
  sectors,
  depots,
  industries,
  clients,
}) {
  const mapAdminActive = showErpPanel && isMapAdminPanel(panelState.panel)

  const railPanelBody = isCreatingRegion ? (
    <RegionCreateRail
      form={createSession.createRegionForm}
      onChange={(patch) => createSession.setCreateRegionForm((prev) => ({ ...prev, ...patch }))}
      clipNotice={createSession.regionDraw.clipNotice}
      formError={createSession.createRegionError}
      isSubmitting={createSession.isCreatingRegionSubmitting}
      onSubmit={createSession.handleCreateRegionSubmit}
      onCancel={createSession.cancelRegionCreate}
    />
  ) : isCreatingIndustry ? (
    <IndustryCreateRail
      form={createSession.createIndustryForm}
      onChange={(patch) => createSession.setCreateIndustryForm((prev) => ({ ...prev, ...patch }))}
      formError={createSession.createIndustryError}
      isSubmitting={createSession.isCreatingIndustrySubmitting}
      onSubmit={createSession.handleCreateIndustrySubmit}
      onCancel={createSession.cancelIndustryCreate}
    />
  ) : showEntityDetail ? (
    <DetailPanel
      selectedElement={selectedElement}
      details={editSession.details}
      isLoadingDetails={editSession.isLoadingDetails}
      detailsError={editSession.detailsError}
      isEditing={editSession.isEditing}
      isSavingEdit={editSession.isSavingEdit}
      saveError={editSession.saveError}
      editForm={editSession.editForm}
      onEditFormChange={editSession.handleEditFormChange}
      regions={regions}
      depots={editSession.editDepots}
      users={editSession.users}
      editOptionsLoading={editSession.editOptionsLoading}
      editOptionsError={editSession.editOptionsError}
      canManageLogistics={canManageLogistics}
      canEditMapEntity={canEditMapEntity}
      canUpdateClientCredit={canUpdateClientCredit}
      onClose={() => {
        editSession.handleClose()
        if (panelState.panel && isMapAdminPanel(panelState.panel)) {
          onNavigate(buildGlobalMapPanelHref(panelState.panel))
        } else if (!panelState.panel) {
          onNavigate('/')
        }
      }}
      onNavigate={onNavigate}
      onEnterEdit={editSession.enterEditMode}
      onSaveEdit={editSession.handleSaveEdit}
      onCancelEdit={editSession.cancelEdit}
      regionEditClipNotice={editSession.regionEditDrawHook.clipNotice}
      onClientDetailsUpdate={
        canUpdateClientCredit?.(editSession.details)
          ? (updated) =>
              editSession.setDetails((prev) => (prev ? { ...prev, ...updated } : updated))
          : undefined
      }
      followVehicleId={followVehicleId}
      onReFollowVehicle={(vehicleId) => {
        const vehicle = vehicles.find((row) => row.id === vehicleId)
        onSelect({
          type: 'vehicle',
          id: vehicleId,
          name: vehicle?.plate_number || 'Vehicle',
        })
      }}
      onStopFollowVehicle={() => setFollowVehicleId(null)}
      onLinkWialon={(vehicle) => setWialonLinkVehicle(vehicle)}
    />
  ) : mapAdminActive ? (
    <MapAdminRailPanel
      panelKey={panelState.panel}
      searchQuery={mapLayerSearch}
      isLoading={isLoading}
      onRefresh={refreshMapData}
      onSelectItem={onSelect}
      onStartRegionCreate={createSession.startRegionCreate}
      onStartIndustryCreate={createSession.startIndustryCreate}
      canManageLogistics={canManageLogistics}
      canCreateMapEntity={canCreateMapEntity}
      regions={regions}
      sectors={sectors}
      depots={depots}
      industries={industries}
      clients={clients}
      vehicles={vehicles}
    />
  ) : showErpPanel ? (
    <CcPanelHost
      panelKey={panelState.panel}
      id={panelState.id}
      focus={panelState.focus}
      hasPermission={hasPermission}
    />
  ) : (
    <MapHomeSidePanel />
  )

  const fetchDepotOps =
    !panelState.panel && !isCreatingRegion && !isCreatingIndustry && !showEntityDetail

  return (
    <CommandCenterRailShell
      depotId={depotId}
      onDepotChange={onDepotChange}
      period={missionPeriod}
      onPeriodChange={onPeriodChange}
      searchQuery={mapLayerSearch}
      onSearchChange={onMapLayerSearchChange}
      searchVisible={
        mapAdminActive && !isCreatingRegion && !isCreatingIndustry
      }
      searchDisabled={isCreatingRegion || isCreatingIndustry}
      fetchDepotOps={fetchDepotOps}
    >
      {railPanelBody}
    </CommandCenterRailShell>
  )
}
