import { useState } from 'react'

export const EMPTY_EDIT_FORM = {
  sectorName: '',
  regionId: '',
  depotId: '',
  assignedProfileId: '',
  isActive: true,
}

export function useMapEdit() {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)
  const [editRings, setEditRings] = useState(null)
  const [editDepots, setEditDepots] = useState([])
  const [users, setUsers] = useState([])
  const [editOptionsLoading, setEditOptionsLoading] = useState(false)
  const [editOptionsError, setEditOptionsError] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [saveError, setSaveError] = useState('')

  return {
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    editRings,
    setEditRings,
    editDepots,
    setEditDepots,
    users,
    setUsers,
    editOptionsLoading,
    setEditOptionsLoading,
    editOptionsError,
    setEditOptionsError,
    isSavingEdit,
    setIsSavingEdit,
    saveError,
    setSaveError,
  }
}
