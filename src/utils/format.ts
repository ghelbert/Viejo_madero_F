import type { Role } from '../types/role'

export const money = (value: number) => `S/ ${Number(value).toFixed(2)}`

export const roleLabel: Record<Role, string> = {
  ADMINISTRADOR: 'Administrador',
  MOZO: 'Mozo',
  COCINERO: 'Cocinero',
}