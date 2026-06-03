import React, { useCallback, useEffect, useRef, useState } from "react";

import { Link, useParams } from "react-router-dom";

import {
  ArrowLeft,
  MapPin,
  Warehouse,
  Globe2,
  User,
  Users,
  Building2,
  Phone,
  Pencil,
  X,
  CheckCircle2,
} from "lucide-react";

import { AnimatedPage } from "../../components/AnimatedPage";

import { SlideOverPanel } from "../../components/SlideOverPanel";

import {
  SectorBoundaryPreview,
  parseSectorBoundary,
} from "../../components/SectorBoundaryPreview";

import {
  SectorBoundaryDrawer,
  isValidSectorPolygon,
} from "../../components/SectorBoundaryDrawer";

import { useAuth } from "../../context/AuthContext";

import apiInstance from "../../api/axiosInstance";

const TABS = [
  { id: "clients", label: "Clients" },

  { id: "staff", label: "Assigned Staff" },
];

function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  return (
    <div className="fixed right-4 top-4 z-[70] max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
          type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        }`}
      >
        <div className="pt-0.5">
          <CheckCircle2 className="h-4 w-4" />
        </div>

        <p className="flex-1 text-sm font-medium">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function sectorToEditForm(sector) {
  return {
    sectorName: sector.sector_name || "",

    regionId: sector.region_id || "",

    depotId: sector.depot_id || "",

    assignedProfileId: sector.assigned_profile_id || "",

    isActive: sector.is_active !== false,

    boundary: parseSectorBoundary(sector.boundary),
  };
}

function DetailsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />

      <div className="h-10 w-64 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-[400px] animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />

          <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
        </div>

        <div className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
      Inactive
    </span>
  );
}

function SidebarRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 border-b border-gray-100 py-4 last:border-0 dark:border-zinc-800">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>

        <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {children}
        </div>
      </div>
    </div>
  );
}

function EmptyTab({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-16 dark:border-zinc-700 dark:bg-zinc-900/40">
      <Icon className="mb-3 h-10 w-10 text-zinc-400 dark:text-zinc-500" />

      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {title}
      </p>

      <p className="mt-1 max-w-sm text-center text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function ClientsTable({ clients }) {
  if (!clients?.length) {
    return (
      <EmptyTab
        icon={Building2}
        title="No clients in this sector"
        description="No clients are currently registered with this sector. New clients created here will appear in this list."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                Client
              </th>

              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                Phone
              </th>

              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                Address
              </th>

              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                GPS
              </th>
            </tr>
          </thead>

          <tbody>
            {clients.map((client) => {
              const hasGps =
                client.gps_latitude != null &&
                client.gps_longitude != null &&
                Number.isFinite(Number(client.gps_latitude)) &&
                Number.isFinite(Number(client.gps_longitude));

              return (
                <tr
                  key={client.id}
                  className="border-b border-gray-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {client.client_name}
                    </p>

                    {client.place_name && (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {client.place_name}
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                    {client.phone || "—"}
                  </td>

                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                    <p>{client.client_address || "—"}</p>

                    {client.city && (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {client.city}
                      </p>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {hasGps ? (
                      <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                        On map
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StaffTable({ staff }) {
  if (!staff?.length) {
    return (
      <EmptyTab
        icon={Users}
        title="No staff assigned"
        description="Assign vendors or supervisors to this sector from User Management to see them here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                Name
              </th>

              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                Role
              </th>

              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                Contact
              </th>

              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {staff.map((member) => (
              <tr
                key={member.id}
                className="border-b border-gray-100 last:border-0 dark:border-zinc-800"
              >
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                  {member.full_name || "—"}
                </td>

                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                  {member.role || "—"}
                </td>

                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                  <p>{member.email || "—"}</p>

                  {member.phone && (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {member.phone}
                    </p>
                  )}
                </td>

                <td className="px-6 py-4 capitalize text-zinc-500 dark:text-zinc-400">
                  {member.status || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString();
}

export function SectorDetailsPage() {
  const { id } = useParams();

  const { hasPermission } = useAuth();

  const canManageLogistics = hasPermission("manage_logistics");

  const [sector, setSector] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("clients");

  const controllerRef = useRef(null);

  const [toast, setToast] = useState({ message: "", type: "success" });

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    sectorName: "",

    regionId: "",

    depotId: "",

    assignedProfileId: "",

    isActive: true,

    boundary: null,
  });

  const [editFormError, setEditFormError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mapDrawerKey, setMapDrawerKey] = useState(0);

  const [regions, setRegions] = useState([]);

  const [depots, setDepots] = useState([]);

  const [users, setUsers] = useState([]);

  const fetchSector = useCallback(
    async (signal) => {
      const res = await apiInstance.get(`/sectors/${id}`, { signal });

      return res.data?.data?.sector || null;
    },
    [id],
  );

  useEffect(() => {
    if (!id) return undefined;

    if (controllerRef.current) controllerRef.current.abort();

    const controller = new AbortController();

    controllerRef.current = controller;

    const load = async () => {
      setIsLoading(true);

      setError("");

      try {
        const data = await fetchSector(controller.signal);

        if (!controller.signal.aborted) {
          setSector(data);
        }
      } catch (err) {
        if (err.name !== "CanceledError" && !controller.signal.aborted) {
          setSector(null);

          setError(
            err?.response?.data?.message || "Failed to load sector details.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    load();

    return () => controllerRef.current?.abort();
  }, [id, fetchSector]);

  useEffect(() => {
    if (!canManageLogistics) return undefined;

    const controller = new AbortController();

    Promise.all([
      apiInstance.get("/regions", { signal: controller.signal }),

      apiInstance.get("/depots", { signal: controller.signal }),

      apiInstance.get("/users", { signal: controller.signal }),
    ])

      .then(([regionsRes, depotsRes, usersRes]) => {
        if (controller.signal.aborted) return;

        setRegions(regionsRes.data?.data?.regions || []);

        setDepots(depotsRes.data?.data?.depots || []);

        setUsers(usersRes.data?.data?.users || []);
      })

      .catch(() => {});

    return () => controller.abort();
  }, [canManageLogistics]);

  const openEdit = () => {
    if (!sector) return;

    setEditForm(sectorToEditForm(sector));

    setEditFormError("");

    setMapDrawerKey((key) => key + 1);

    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.sectorName.trim()) {
      setEditFormError("Sector name is required.");

      return;
    }

    if (!isValidSectorPolygon(editForm.boundary)) {
      setEditFormError(
        "A valid boundary is required. Use Draw to place corners, then Save on the map.",
      );

      return;
    }

    setIsSubmitting(true);

    setEditFormError("");

    try {
      await apiInstance.put(`/sectors/${id}`, {
        sectorName: editForm.sectorName.trim(),

        regionId: editForm.regionId || null,

        depotId: editForm.depotId || null,

        assignedProfileId: editForm.assignedProfileId || null,

        boundary: editForm.boundary,

        isActive: editForm.isActive,
      });

      const refreshed = await fetchSector();

      setSector(refreshed);

      setIsEditOpen(false);

      setToast({ message: "Sector updated successfully.", type: "success" });
    } catch (err) {
      setEditFormError(
        err?.response?.data?.message || "Failed to update sector.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const clients = sector?.clients || [];

  const staff = sector?.staff || [];

  const stats = sector?.stats || {};

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />

      <AnimatedPage>
        <div className="mx-auto max-w-7xl space-y-8 p-8">
          {isLoading ? (
            <DetailsSkeleton />
          ) : error || !sector ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-500/30 dark:bg-red-500/10">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {error || "Sector not found."}
              </p>

              <Link
                to="/sectors"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sectors
              </Link>
            </div>
          ) : (
            <>
              <header className="space-y-3">
                <Link
                  to="/sectors"
                  className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sectors
                </Link>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {sector.sector_name}
                  </h1>

                  <StatusBadge isActive={sector.is_active !== false} />

                  {canManageLogistics && (
                    <button
                      type="button"
                      onClick={openEdit}
                      className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Sector
                    </button>
                  )}
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {stats.client_count ?? clients.length} client
                  {(stats.client_count ?? clients.length) === 1 ? "" : "s"}
                  {" · "}
                  {stats.staff_count ?? staff.length} staff assigned
                </p>
              </header>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left column — map & business data */}

                <div className="space-y-6 lg:col-span-2">
                  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        <MapPin className="h-4 w-4 text-zinc-500" />
                        Coverage map
                      </h2>

                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Sector boundary and client locations with GPS
                        coordinates.
                      </p>
                    </div>

                    <div className="p-4">
                      <SectorBoundaryPreview
                        key={`preview-${sector.id}-${sector.updated_at || ""}`}
                        boundary={sector.boundary}
                        clients={clients}
                        mapClassName="h-[400px]"
                      />
                    </div>
                  </section>

                  <section>
                    <nav className="flex gap-8 border-b border-gray-200 dark:border-zinc-800">
                      {TABS.map((tab) => {
                        const count =
                          tab.id === "clients" ? clients.length : staff.length;

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative pb-3 text-sm font-medium transition-colors ${
                              activeTab === tab.id
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            }`}
                          >
                            {tab.label}

                            <span className="ml-1.5 text-xs text-zinc-400">
                              ({count})
                            </span>

                            {activeTab === tab.id && (
                              <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-zinc-900 dark:bg-zinc-100" />
                            )}
                          </button>
                        );
                      })}
                    </nav>

                    <div className="mt-6">
                      {activeTab === "clients" ? (
                        <ClientsTable clients={clients} />
                      ) : (
                        <StaffTable staff={staff} />
                      )}
                    </div>
                  </section>
                </div>

                {/* Right column — about */}

                <aside className="lg:col-span-1">
                  <div className="sticky top-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      About this sector
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Operational context for this coverage area.
                    </p>

                    <div className="mt-2">
                      <SidebarRow icon={MapPin} label="Status">
                        <StatusBadge isActive={sector.is_active !== false} />
                      </SidebarRow>

                      <SidebarRow icon={Globe2} label="Region">
                        {sector.regions?.region_name ? (
                          <Link
                            to="/regions"
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {sector.regions.region_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </SidebarRow>

                      <SidebarRow icon={Warehouse} label="Fulfillment depot">
                        {sector.depots?.depot_name ? (
                          <Link
                            to={`/depots/${sector.depot_id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {sector.depots.depot_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </SidebarRow>

                      <SidebarRow icon={User} label="Default owner">
                        {sector.profiles?.full_name || "—"}

                        {sector.assigned_profile_id && (
                          <p className="mt-1 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                            Profile on sector record
                          </p>
                        )}
                      </SidebarRow>

                      <SidebarRow icon={Users} label="Field staff">
                        <span>{staff.length} assigned via user management</span>
                      </SidebarRow>

                      <SidebarRow icon={Phone} label="Clients registered">
                        <span>{clients.length} in this sector</span>
                      </SidebarRow>
                    </div>

                    <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Administrative
                      </p>

                      <dl className="mt-3 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <div className="flex justify-between gap-4">
                          <dt>Sector ID</dt>

                          <dd
                            className="max-w-[140px] truncate font-mono text-zinc-600 dark:text-zinc-300"
                            title={sector.id}
                          >
                            {sector.id}
                          </dd>
                        </div>

                        <div className="flex justify-between gap-4">
                          <dt>Created</dt>

                          <dd className="text-right text-zinc-600 dark:text-zinc-300">
                            {formatDate(sector.created_at)}
                          </dd>
                        </div>

                        <div className="flex justify-between gap-4">
                          <dt>Updated</dt>

                          <dd className="text-right text-zinc-600 dark:text-zinc-300">
                            {formatDate(sector.updated_at)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </AnimatedPage>

      <SlideOverPanel
        isOpen={isEditOpen && Boolean(sector)}
        onClose={() => setIsEditOpen(false)}
        disableClose={isSubmitting}
        title="Edit Sector"
        description="Update metadata and redraw the coverage boundary if needed."
        footer={
          <div className="space-y-3">
            {editFormError ? (
              <p className="text-sm text-red-500">{editFormError}</p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="submit"
                form="edit-sector-form"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isSubmitting ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsEditOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </div>
        }
      >
        <form
          id="edit-sector-form"
          onSubmit={handleEditSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={editForm.sectorName}
              onChange={(e) =>
                setEditForm({ ...editForm, sectorName: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Region
            </label>

            <select
              value={editForm.regionId}
              onChange={(e) =>
                setEditForm({ ...editForm, regionId: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="">No region</option>

              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Fulfillment Depot
            </label>

            <select
              value={editForm.depotId}
              onChange={(e) =>
                setEditForm({ ...editForm, depotId: e.target.value })
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="">No depot</option>

              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.depot_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Default Owner
            </label>

            <select
              value={editForm.assignedProfileId}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  assignedProfileId: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="">None</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email || user.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Status
            </label>

            <div className="flex gap-3">
              {[
                { value: true, label: "Active" },

                { value: false, label: "Inactive" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() =>
                    setEditForm({ ...editForm, isActive: opt.value })
                  }
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                    editForm.isActive === opt.value
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-gray-200 text-zinc-500 hover:border-gray-400 dark:border-zinc-700 dark:hover:border-zinc-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sector boundary <span className="text-red-500">*</span>
            </label>

            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Existing boundary is pre-loaded. Use Clear to redraw, or Draw to
              adjust corners.
            </p>

            <SectorBoundaryDrawer
              key={mapDrawerKey}
              value={editForm.boundary}
              onChange={(boundary) =>
                setEditForm((prev) => ({ ...prev, boundary }))
              }
            />
          </div>
        </form>
      </SlideOverPanel>
    </>
  );
}
