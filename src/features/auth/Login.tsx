import { useState } from 'react'
import styles from '../../App.module.css'
import { api, type User } from '../../api'

export function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      onLogin(await api.login(username, password))
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'No se pudo iniciar sesión. Inténtalo nuevamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.loginShell}>
      <section className={styles.loginStory}>
        <div className={styles.storyContent}>
          <div className={styles.loginBrand}>
            <span className={styles.brandMark}>VM</span>
            <strong>El Viejo Madero</strong>
          </div>
          <div className={styles.storyCopy}>
            <h1>
              Cocina de leña,
              <br />
              servicio de siempre.
            </h1>
            <p>
              Pedidos en salón, coordinación de cocina y gestión de la carta en
              un solo lugar.
            </p>
          </div>
          <span className={styles.storyCaption}>Sistema de gestión interno</span>
        </div>
      </section>
      <section className={styles.loginPanel}>
        <div className={styles.loginFormWrap}>
          <div className={styles.referenceBrand}>
            <span className={styles.referenceLogo}>VM</span>
            <strong>El Viejo Madero</strong>
          </div>
          <h2>Iniciar sesión</h2>
          <p className={styles.loginIntro}>
            Ingresa con tu usuario para continuar.
          </p>
          <form className={styles.loginForm} onSubmit={submit}>
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error && <p className={styles.loginError}>{error}</p>}
            <button className={styles.loginButton} disabled={loading}>
              {loading ? 'Validando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}