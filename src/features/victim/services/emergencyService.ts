import { config } from '@/core/config'
import apiClient from '@/core/api/apiClient'
import { EmergencyAlert, EmergencyStatus, GeoLocation } from '@/shared/types'




const MOCK_KEY = 'safezone_emergency_alerts'

const getMockAlerts = (): EmergencyAlert[] => {
  try {
    const stored = sessionStorage.getItem(MOCK_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

const saveMockAlerts = (alerts: EmergencyAlert[]) => {
  try { sessionStorage.setItem(MOCK_KEY, JSON.stringify(alerts)) } catch {  }
}

const delay = (ms = config.MOCK_DELAY) => new Promise(r => setTimeout(r, ms))

const mapEstadoToStatus = (estado: string): EmergencyStatus => {
  const map: Record<string, EmergencyStatus> = {
    ACTIVA: 'ACTIVE',
    ATENDIDA: 'ATTENDED',
    RESUELTA: 'RESOLVED',
  }
  return map[estado] ?? 'ACTIVE'
}

const mapBackendAlertToEmergencyAlert = (raw: any): EmergencyAlert => ({
  id: raw.id,
  victimId: raw.victimaId,
  victimName: raw.victimaNombre,
  victimEmail: raw.victimaEmail,
  location: (raw.latitud != null && raw.longitud != null) ? {
    latitude: raw.latitud,
    longitude: raw.longitud,
    accuracy: raw.precision ?? undefined,
    timestamp: raw.creadoEn ?? new Date().toISOString(),
  } : undefined,
  manualAddress: raw.direccionManual ?? undefined,
  message: raw.mensaje ?? undefined,
  status: mapEstadoToStatus(raw.estado),
  createdAt: raw.creadoEn,
  attendedBy: raw.atendidoPorId ?? undefined,
  attendedByName: raw.atendidoPorNombre ?? undefined,
  attendedAt: raw.atendidoEn ?? undefined,
  resolvedAt: raw.resueltoEn ?? undefined,
})

export const emergencyService = {
  
  sendPanicAlert: async (params: {
    victimId: string
    victimName: string
    victimEmail: string
    location?: GeoLocation
    manualAddress?: string
    message?: string
  }): Promise<EmergencyAlert> => {
    if (config.USE_MOCK) {
      await delay(500)
      const alert: EmergencyAlert = {
        id: `alert_${Date.now()}`,
        ...params,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      }
      const alerts = getMockAlerts()
      alerts.unshift(alert)
      saveMockAlerts(alerts)
      return alert
    }
    
    const backendPayload = {
      victimaId: params.victimId,
      victimaNombre: params.victimName,
      victimaEmail: params.victimEmail,
      latitud: params.location?.latitude,
      longitud: params.location?.longitude,
      precision: params.location?.accuracy,
      direccionManual: params.manualAddress,
      mensaje: params.message,
    }
    const { data } = await apiClient.post<EmergencyAlert>('/emergency/alerts', backendPayload)
    return mapBackendAlertToEmergencyAlert(data)
  },

  
  getActiveAlerts: async (): Promise<EmergencyAlert[]> => {
    if (config.USE_MOCK) {
      await delay(300)
      return getMockAlerts().filter(a => a.status === 'ACTIVE')
    }
    const { data } = await apiClient.get<EmergencyAlert[]>('/emergency/alerts', {
      params: { status: 'ACTIVE' },
    })
    return (data as any[]).map(mapBackendAlertToEmergencyAlert)
  },

  getAllAlerts: async (): Promise<EmergencyAlert[]> => {
    if (config.USE_MOCK) {
      await delay(300)
      return getMockAlerts()
    }
    const { data } = await apiClient.get<EmergencyAlert[]>('/emergency/alerts')
    return (data as any[]).map(mapBackendAlertToEmergencyAlert)
  },

  
  attendAlert: async (alertId: string, professionalId: string, professionalName: string): Promise<EmergencyAlert> => {
    if (config.USE_MOCK) {
      await delay(200)
      const alerts = getMockAlerts()
      const alert = alerts.find(a => a.id === alertId)
      if (!alert) throw new Error('Alert not found')
      alert.status = 'ATTENDED'
      alert.attendedBy = professionalId
      alert.attendedByName = professionalName
      alert.attendedAt = new Date().toISOString()
      saveMockAlerts(alerts)
      return alert
    }
    const { data } = await apiClient.patch<EmergencyAlert>(`/emergency/alerts/${alertId}/attend`, {
      professionalId,
      professionalName,
    })
    return mapBackendAlertToEmergencyAlert(data)
  },

  resolveAlert: async (alertId: string): Promise<EmergencyAlert> => {
    if (config.USE_MOCK) {
      await delay(200)
      const alerts = getMockAlerts()
      const alert = alerts.find(a => a.id === alertId)
      if (!alert) throw new Error('Alert not found')
      alert.status = 'RESOLVED'
      alert.resolvedAt = new Date().toISOString()
      saveMockAlerts(alerts)
      return alert
    }
    const { data } = await apiClient.patch<EmergencyAlert>(`/emergency/alerts/${alertId}/resolve`)
    return mapBackendAlertToEmergencyAlert(data)
  },
}


export const getCurrentPosition = (): Promise<GeoLocation> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser does not support geolocation'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude ?? undefined,
          timestamp: new Date(pos.timestamp).toISOString(),
        }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })


export const buildMapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps?q=${lat},${lng}`
