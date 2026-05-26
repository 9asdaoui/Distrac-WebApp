import React from 'react'
import { LocationMapCard } from './LocationMap'

/** Standalone empty map card (same layout as LocationMapCard without coordinates) */
export function LocationMapEmpty({ message }) {
  return <LocationMapCard lat={null} lng={null} name="" emptyMessage={message} />
}