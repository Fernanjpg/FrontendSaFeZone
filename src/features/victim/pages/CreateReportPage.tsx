import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, TextArea, Select, Alert } from '@/components'
import { FileText, ArrowLeft, MapPin } from 'lucide-react'
import { reportService } from '@/features/victim/services/reportService'
import { getCurrentPosition } from '@/features/victim/services/emergencyService'

export const CreateReportPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    priority: 'MEDIUM',
    location: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleGetLocation = async () => {
    setIsLoadingLocation(true)
    setError('')
    try {
      const loc = await getCurrentPosition()
      handleChange('location', `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`)
    } catch (err: any) {
      setError(err.message || 'Error al obtener la ubicación')
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Titulo del incidente es obligatorio')
      return false
    }
    if (!formData.description.trim()) {
      setError('Descripcion del incidente es obligatoria')
      return false
    }
    if (!formData.type) {
      setError('Debes seleccionar un tipo de incidente')
      return false
    }
    if (formData.description.length < 20) {
      setError('La descripcion debe tener al menos 20 caracteres')
      return false
    }
    if (!formData.location.trim()) {
      setError('La ubicacion o direccion es obligatoria')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const userData = sessionStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : null

    if (!user || user.role !== 'VICTIM') {
      setError('Usuario no autorizado para crear un reporte')
      return
    }

    setIsLoading(true)
    try {
      await reportService.createReport(user.id, {
        title: formData.title,
        description: formData.description,
        type: formData.type as any,
        priority: formData.priority as any,
        status: 'PENDING',
        location: formData.location,
      })

      setSuccess(true)
      setFormData({ title: '', description: '', type: '', priority: 'MEDIUM', location: '' })
      
      
      setTimeout(() => {
        navigate('/dashboard/victim')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Error al crear el reporte')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard/victim')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrar Nueva Denuncia</h1>
        <p className="text-gray-600">
          Tu información está protegida y encriptada. Solo los profesionales asignados podrán verla.
        </p>
      </div>

      
      <div className="mb-6 space-y-3">
        {success && (
          <Alert
            type="success"
            title="Denuncia registrada exitosamente!"
            message="Tu denuncia ha sido enviada. Serás redirigido en breve..."
          />
        )}
        {error && (
          <Alert
            type="danger"
            title="Error al registrar la denuncia"
            message={error}
            dismissible
            onClose={() => setError('')}
          />
        )}
      </div>

      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="General Information" className="space-y-4">
          <Input
            label="Titulo del Incidente"
            placeholder="Proporciona un título breve y descriptivo"
            value={formData.title}
            onChange={(value) => handleChange('title', value)}
            required
          />

          <TextArea
            label="Descripcion del Incidente"
            placeholder="Proporciona todos los detalles relevantes. Sé lo más específico posible sin incluir información personal sensible."
            value={formData.description}
            onChange={(value) => handleChange('description', value)}
            maxLength={2000}
            rows={6}
            required
          />

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Locación o Dirección del Incidente"
                placeholder="Ciudad, Vecindario o área (opcional)"
                value={formData.location}
                onChange={(value) => handleChange('location', value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="mb-4 whitespace-nowrap"
              onClick={handleGetLocation}
              isLoading={isLoadingLocation}
            >
              <MapPin className="w-4 h-4 inline mr-2" />
              Obtener ubicación actual
            </Button>
          </div>
        </Card>

        <Card title="Clasificación del Incidente" className="space-y-4">
          <Select
            label="Tipo de Incidente"
            value={formData.type}
            onChange={(value) => handleChange('type', value)}
            options={[
              { value: 'PHYSICAL_VIOLENCE', label: 'Violencia Física' },
              { value: 'PSYCHOLOGICAL_ABUSE', label: 'Abuso Psicológico' },
              { value: 'OTHER', label: 'Otro' },
            ]}
            required
          />

          <Select
            label="Nivel de Urgencia"
            value={formData.priority}
            onChange={(value) => handleChange('priority', value)}
            options={[
              { value: 'LOW', label: 'Bajo (puede esperar)' },
              { value: 'MEDIUM', label: 'Medio (urgencia moderada)' },
              { value: 'HIGH', label: 'Alto (requiere atención inmediata)' },
            ]}
            required
          />
        </Card>

        <Card type="info" className="flex gap-3">
          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Privacidad y Confidencialidad</p>
            <p className="text-sm text-gray-700">
              Tu reporte es completamente confidencial. Solo se compartirá con los profesionales necesarios para tu caso.
            </p>
          </div>
        </Card>

        
        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/dashboard/victim')}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Enviar Denuncia
          </Button>
        </div>
      </form>
    </div>
  )
}
