import React, { useState, useEffect } from "react";
import { Users, UserPlus, Loader, Pencil, PowerOff } from "lucide-react";
import { Button, Card, DataTable, Modal, Input, Select, Alert } from "@/shared/components";
import { adminUserService } from "../services/triageService";
import type { AdminUser } from "@/shared/types";

const regionOptions = [
  { value: "1", label: "Amazonas" },
  { value: "2", label: "Ancash" },
  { value: "3", label: "Apurímac" },
  { value: "4", label: "Arequipa" },
  { value: "5", label: "Ayacucho" },
  { value: "6", label: "Cajamarca" },
  { value: "7", label: "Callao" },
  { value: "8", label: "Cusco" },
  { value: "9", label: "Huancavelica" },
  { value: "10", label: "Huánuco" },
  { value: "11", label: "Ica" },
  { value: "12", label: "Junín" },
  { value: "13", label: "La Libertad" },
  { value: "14", label: "Lambayeque" },
  { value: "15", label: "Lima" },
  { value: "16", label: "Loreto" },
  { value: "17", label: "Madre de Dios" },
  { value: "18", label: "Moquegua" },
  { value: "19", label: "Pasco" },
  { value: "20", label: "Piura" },
  { value: "21", label: "Puno" },
  { value: "22", label: "San Martín" },
  { value: "23", label: "Tacna" },
  { value: "24", label: "Tumbes" },
  { value: "25", label: "Ucayali" },
];

const roleOptions = [
  { value: "admin", label: "Administrador" },
  { value: "gestor", label: "Gestor" },
];

const regionNameToId = (name?: string): string => {
  if (!name) return "15";
  const found = regionOptions.find((r) => r.label.toLowerCase() === name.toLowerCase());
  return found ? found.value : "15";
};

const roleLabel = (role?: AdminUser["role"]): string => {
  if (role === "gestor") return "Gestor";
  if (role === "coordinator") return "Coordinador";
  return "Administrador";
};

interface UserForm {
  id?: string;
  name: string;
  email: string;
  role: string;
  region: string;
  telefono: string;
  password: string;
}

const emptyForm: UserForm = {
  name: "",
  email: "",
  role: "admin",
  region: "15",
  telefono: "",
  password: "",
};

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminUserService.getAdmins();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      region: regionNameToId(user.region),
      telefono: "",
      password: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Nombre y correo son obligatorios");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role as AdminUser["role"],
        region: form.region,
        telefono: form.telefono.trim(),
        password: form.password.trim() || undefined,
      };
      if (form.id) {
        await adminUserService.updateAdmin(form.id, payload);
        setSuccess("Usuario actualizado correctamente");
      } else {
        if (!form.password.trim()) {
          setFormError("La contraseña es obligatoria para nuevos usuarios");
          setIsSaving(false);
          return;
        }
        await adminUserService.createAdmin(payload);
        setSuccess("Usuario creado correctamente");
      }
      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar usuario");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (user: AdminUser) => {
    if (!window.confirm(`¿Desactivar a ${user.name}?`)) return;
    try {
      await adminUserService.deactivateAdmin(user.id);
      setSuccess("Usuario desactivado correctamente");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desactivar usuario");
    }
  };

  const columns = [
    {
      key: "name" as keyof AdminUser,
      label: "Nombre",
      render: (value: any) => <span className="font-medium text-slate-900">{value}</span>,
    },
    { key: "email" as keyof AdminUser, label: "Correo" },
    {
      key: "role" as keyof AdminUser,
      label: "Rol",
      render: (value: any) => roleLabel(value),
    },
    { key: "region" as keyof AdminUser, label: "Región" },
    {
      key: "active" as keyof AdminUser,
      label: "Estado",
      render: (value: any) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            value ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
          }`}
        >
          {value ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "id" as keyof AdminUser,
      label: "Acciones",
      render: (_: any, row: AdminUser) => (
          <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {row.active && (
            <Button variant="outline" size="sm" onClick={() => handleDeactivate(row)}>
              <PowerOff className="h-4 w-4 text-amber-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
            <p className="mt-1 text-sm text-slate-500">
              Administra administradores y gestores del sistema
            </p>
          </div>
          <Button onClick={openCreate}>
            <UserPlus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        </div>
      </Card>

      {error && <Alert type="danger" message={error} />}
      {success && <Alert type="success" message={success} />}

      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader className="h-5 w-5 animate-spin" />
            <span>Cargando usuarios...</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            emptyMessage="No hay usuarios registrados"
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={form.id ? "Editar usuario" : "Nuevo usuario"}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        }
      >
        {formError && (
          <Alert type="danger" message={formError} className="mb-4" />
        )}
        <Input
          label="Nombre completo"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="Ej. María González"
          required
        />
        <Input
          label="Correo electrónico"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          placeholder="usuario@safezone.cr"
          required
        />
        <Select
          label="Rol"
          options={roleOptions}
          value={form.role}
          onChange={(v) => setForm({ ...form, role: v })}
          required
        />
        <Select
          label="Región"
          options={regionOptions}
          value={form.region}
          onChange={(v) => setForm({ ...form, region: v })}
          required
        />
        <Input
          label="Teléfono"
          value={form.telefono}
          onChange={(v) => setForm({ ...form, telefono: v })}
          placeholder="Ej. 88887777"
        />
        <Input
          label={form.id ? "Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          placeholder="••••••••"
          required={!form.id}
        />
      </Modal>
    </div>
  );
};

export default UsersManagementPage;
