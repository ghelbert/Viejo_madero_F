import styles from './Header.module.css'
import type { User } from '../api'
import type { Role } from '../types/role'
import { roleLabel } from '../utils/format'

export function Header({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <header className={styles.waiterHeader}>
      <div className={styles.waiterBrand}>
        <span className={styles.waiterLogo}>VM</span>
        <div>
          <strong>El Viejo Madero</strong>
          <small>
            {roleLabel[user.role as Role]} · {user.full_name}
          </small>
        </div>
      </div>
      <button className={styles.logoutButton} onClick={onLogout}>
        Salir
      </button>
    </header>
  )
}