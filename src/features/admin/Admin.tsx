import { useEffect, useState } from 'react'
import styles from './Admin.module.css'
import modalStyles from '../../components/Modal.module.css'
import { api, type Order, type Product, type User } from '../../api'
import type { Role } from '../../types/role'
import { money, roleLabel } from '../../utils/format'
import { Header } from '../../components/Header'

const duplicateUsernameMessage = 'Ese nombre de usuario ya está registrado.'

const usernameForName = (
  fullName: string,
  users: Array<User & { active: boolean }>,
  excludedUserId?: number,
) => {
  const parts = fullName.trim().split(/\s+/)
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  const firstName = normalize(parts[0] ?? '')
  const surname = normalize(parts[1] ?? '')
  const base = parts.length > 1 ? `${firstName.slice(0, 1)}${surname}` : firstName
  if (!base) return ''

  let username = base
  let suffix = 2
  while (
    users.some(
      (item) =>
        item.id !== excludedUserId &&
        item.username.toLowerCase() === username.toLowerCase(),
    )
  ) {
    username = `${base}${suffix}`
    suffix += 1
  }
  return username
}

export function Admin({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [users, setUsers] = useState<Array<User & { active: boolean }>>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [tab, setTab] = useState<'Resumen' | 'Carta' | 'Empleados'>('Resumen')
  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showUserPassword, setShowUserPassword] = useState(false)
  const [editingUser, setEditingUser] = useState<(User & { active: boolean }) | null>(null)
  const [productForm, setProductForm] = useState({
    category: '',
    name: '',
    description: '',
    price: '',
    prepMinutes: '10',
  })
  const [userForm, setUserForm] = useState({
    fullName: '',
    username: '',
    dni: '',
    phone: '',
    password: '',
    role: '',
    active: true,
  })

  const closeUserForm = () => {
    setShowUserForm(false)
    setEditingUser(null)
    setShowUserPassword(false)
    setUserForm({
      fullName: '',
      username: '',
      dni: '',
      phone: '',
      password: '',
      role: '',
      active: true,
    })
  }

  const openNewUserForm = () => {
    setEditingUser(null)
    setShowUserPassword(false)
    setUserForm({
      fullName: '',
      username: '',
      dni: '',
      phone: '',
      password: '',
      role: '',
      active: true,
    })
    setShowUserForm(true)
  }

  const load = async () => {
    try {
      const [loadedUsers, loadedOrders, loadedProducts, loadedCategories] =
        await Promise.all([
          api.users(),
          api.orders(),
          api.adminProducts(),
          api.categories(),
        ])
      setUsers(loadedUsers)
      setOrders(loadedOrders)
      setProducts(loadedProducts)
      setCategories(loadedCategories)
      if (!productForm.category && loadedCategories[0])
        setProductForm((current) => ({
          ...current,
          category: loadedCategories[0].name,
        }))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudo cargar la administración',
      )
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [loadedUsers, loadedOrders, loadedProducts, loadedCategories] =
          await Promise.all([
            api.users(),
            api.orders(),
            api.adminProducts(),
            api.categories(),
          ])
        setUsers(loadedUsers)
        setOrders(loadedOrders)
        setProducts(loadedProducts)
        setCategories(loadedCategories)
        if (loadedCategories[0])
          setProductForm((current) => ({
            ...current,
            category: loadedCategories[0].name,
          }))
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar la administración',
        )
      }
    }
    void loadInitialData()
  }, [])

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setUsernameError('')
    const data = {
      ...userForm,
      fullName: userForm.fullName.trim(),
      username: userForm.username.trim(),
      dni: userForm.dni,
      phone: userForm.phone,
    }
    const usernameTaken = users.some(
      (item) => item.username === data.username && item.id !== editingUser?.id,
    )
    if (usernameTaken) {
      setUsernameError(duplicateUsernameMessage)
      return
    }
    try {
      if (editingUser) await api.updateUser(editingUser.id, data)
      else {
        await api.createUser(data)
      }
      setSuccessMessage(
        editingUser
          ? 'Empleado actualizado correctamente.'
          : 'Empleado creado correctamente.',
      )
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo guardar el empleado.'
      if (message === duplicateUsernameMessage) setUsernameError(message)
      else setError(message)
      return
    }
    closeUserForm()
    await load()
  }

  const createProduct = async (event: React.FormEvent) => {
    event.preventDefault()
    const data = {
      ...productForm,
      price: Number(productForm.price),
      prepMinutes: Number(productForm.prepMinutes),
    }
    if (editingProduct)
      await api.updateProduct(
        {
          ...editingProduct,
          name: data.name,
          description: data.description,
          category: data.category,
          base_price: data.price,
        },
        editingProduct.available !== false,
      )
    else {
      await api.createProduct(data)
      setSuccessMessage('Plato creado correctamente.')
    }
    setEditingProduct(null)
    setProductForm((current) => ({
      ...current,
      name: '',
      description: '',
      price: '',
    }))
    setShowProductForm(false)
    await load()
  }

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <main className={styles.adminContent}>
        <div className={styles.adminIntro}>
          <div>
            <h1>Administración</h1>
            <p>Usuarios, roles, carta y operación del restaurante.</p>
          </div>
          <nav className={styles.adminTabs}>
            {(['Resumen', 'Carta', 'Empleados'] as const).map((item) => (
              <button
                key={item}
                className={tab === item ? styles.adminTabActive : ''}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        {error && <p className={styles.adminError}>{error}</p>}

        {tab === 'Resumen' && (
          <section className={styles.adminStats}>
            <div className={styles.adminStat}>
              <div>
                <small>Pedidos activos</small>
                <strong>
                  {
                    orders.filter(
                      (order) => !['SERVED', 'CANCELLED'].includes(order.status),
                    ).length
                  }
                </strong>
              </div>
            </div>
            <div className={styles.adminStat}>
              <div>
                <small>Usuarios activos</small>
                <strong>{users.filter((item) => item.active).length}</strong>
              </div>
            </div>
            <div className={styles.adminStat}>
              <div>
                <small>Ventas registradas</small>
                <strong>
                  {money(
                    orders.reduce(
                      (sum, order) => sum + Number(order.total),
                      0,
                    ),
                  )}
                </strong>
              </div>
            </div>
          </section>
        )}

        {tab === 'Carta' && (
          <section className={styles.adminOrders}>
            <div className={styles.adminSectionHeader}>
              <h2>Platos y disponibilidad</h2>
              <button
                className={styles.adminActionButton}
                onClick={() => {
                  setEditingProduct(null)
                  setShowProductForm((current) => !current)
                }}
              >
                {showProductForm ? 'Cancelar' : 'Nuevo plato'}
              </button>
            </div>
            {showProductForm && (
              <form className={styles.adminForm} onSubmit={createProduct}>
                <input
                  placeholder="Nombre del plato"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm({ ...productForm, name: event.target.value })
                  }
                  required
                />
                <input
                  placeholder="Descripción"
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      description: event.target.value,
                    })
                  }
                />
                <select
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      category: event.target.value,
                    })
                  }
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id}>{category.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Precio"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm({ ...productForm, price: event.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Minutos de preparación"
                  value={productForm.prepMinutes}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      prepMinutes: event.target.value,
                    })
                  }
                  required
                />
                <button className={styles.adminActionButton}>
                  {editingProduct ? 'Guardar cambios' : 'Guardar plato'}
                </button>
              </form>
            )}
            <div className={styles.adminTableWrap}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Plato</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <th>{product.name}</th>
                      <td>{product.category}</td>
                      <td>{money(Number(product.base_price))}</td>
                      <td>
                        {product.available === false
                          ? 'No disponible'
                          : 'Disponible'}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setProductForm({
                              category: product.category,
                              name: product.name,
                              description: product.description ?? '',
                              price: String(product.base_price),
                              prepMinutes: '10',
                            })
                            setShowProductForm(true)
                          }}
                        >
                          Editar
                        </button>{' '}
                        <button
                          onClick={async () => {
                            await api.updateProduct(
                              product,
                              product.available === false,
                            )
                            await load()
                          }}
                        >
                          {product.available === false ? 'Activar' : 'Desactivar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'Empleados' && (
          <section className={styles.adminOrders}>
            <div className={styles.adminSectionHeader}>
              <h2>Empleados y roles</h2>
              <button
                className={styles.adminActionButton}
                onClick={showUserForm ? closeUserForm : openNewUserForm}
              >
                {showUserForm ? 'Cancelar' : 'Nuevo empleado'}
              </button>
            </div>
            <div className={styles.adminTableWrap}>
              <table className={`${styles.adminTable} ${styles.usersTable}`}>
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      <th>
                        <span className={styles.employeeIdentity}>
                          <span className={styles.employeeAvatar} aria-hidden="true">
                            {item.full_name.trim().slice(0, 1).toUpperCase()}
                          </span>
                          <span className={styles.employeeName}>{item.full_name}</span>
                        </span>
                      </th>
                      <td>
                        <code className={styles.usernameBadge}>{item.username}</code>
                      </td>
                      <td>
                        <span
                          className={styles.roleBadge}
                          data-role={item.role}
                        >
                          {roleLabel[item.role as Role] ?? item.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.userStatus}
                          data-active={item.active}
                        >
                          <span aria-hidden="true" />
                          {item.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.userIconButton}
                          type="button"
                          aria-label={`Editar a ${item.full_name}`}
                          title={`Editar a ${item.full_name}`}
                          onClick={() => {
                            setEditingUser(item)
                            setShowUserPassword(false)
                            setUserForm({
                              fullName: item.full_name,
                              username: item.username,
                              dni: item.dni ?? '',
                              phone: item.phone ?? '',
                              password: '',
                              role: item.role,
                              active: item.active,
                            })
                            setShowUserForm(true)
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
                          </svg>
                        </button>
                        <button
                          className={styles.userIconButton}
                          type="button"
                          aria-label={`${item.active ? 'Desactivar' : 'Activar'} a ${item.full_name}`}
                          title={`${item.active ? 'Desactivar' : 'Activar'} empleado`}
                          onClick={async () => {
                            await api.toggleUser(item.id, !item.active)
                            await load()
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 3v9m5.7-5.7a8 8 0 1 1-11.4 0" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      {showUserForm && (
        <div
          className={styles.userFormBackdrop}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeUserForm()
          }}
        >
          <section
            className={styles.userDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-dialog-title"
          >
            <header className={styles.userDialogHeader}>
              <div>
                <h2 id="user-dialog-title">
                  {editingUser ? 'Modificar empleado' : 'Nuevo empleado'}
                </h2>
                <p>
                  {editingUser
                    ? 'Actualiza los datos, rol y acceso del empleado.'
                    : 'Registra un nuevo colaborador con su rol y credenciales de acceso.'}
                </p>
              </div>
              <button
                type="button"
                className={styles.userDialogClose}
                aria-label="Cerrar formulario"
                onClick={closeUserForm}
              >
                ×
              </button>
            </header>
            <form className={styles.userForm} onSubmit={createUser}>
              <label className={styles.userField}>
                <span>Nombre completo</span>
                <input
                  autoFocus
                  autoComplete="name"
                  placeholder="Ej: Juan Pérez García"
                  value={userForm.fullName}
                  onChange={(event) => {
                    const fullName = event.target.value
                    setUsernameError('')
                    setUserForm((current) => ({
                      ...current,
                      fullName,
                      username: usernameForName(
                        fullName,
                        users,
                        editingUser?.id,
                      ),
                    }))
                  }}
                  required
                />
              </label>
              <div className={styles.userFormRow}>
                <label className={styles.userField}>
                  <span>DNI</span>
                  <input
                    autoComplete="off"
                    inputMode="numeric"
                    maxLength={8}
                    pattern="[0-9]{8}"
                    placeholder="8 dígitos"
                    value={userForm.dni}
                    onChange={(event) =>
                      setUserForm((current) => ({
                        ...current,
                        dni: event.target.value.replace(/\D/g, '').slice(0, 8),
                      }))
                    }
                    required={!editingUser}
                  />
                </label>
                <label className={styles.userField}>
                  <span>Teléfono</span>
                  <input
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={9}
                    pattern="[0-9]{9}"
                    placeholder="9 dígitos"
                    value={userForm.phone}
                    onChange={(event) =>
                      setUserForm((current) => ({
                        ...current,
                        phone: event.target.value.replace(/\D/g, '').slice(0, 9),
                      }))
                    }
                    required={!editingUser}
                  />
                </label>
              </div>
              <label className={styles.userField}>
                <span>
                  Nombre de usuario
                  <small>Generado automáticamente</small>
                </span>
                <span className={styles.generatedUsername}>
                  <span aria-hidden="true">@</span>
                  <input
                    aria-label="Nombre de usuario generado"
                    value={userForm.username}
                    readOnly
                    required
                  />
                </span>
                <small className={styles.userFieldHint}>
                  Formato: primera letra del nombre + primer apellido (ej: jperez).
                </small>
              </label>
              <label className={styles.userField}>
                <span>Rol</span>
                <select
                  value={userForm.role}
                  onChange={(event) => {
                    setUsernameError('')
                    setUserForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }}
                  required
                >
                  <option value="" disabled>
                    Seleccione un rol...
                  </option>
                  <option value="MOZO">Mozo</option>
                  <option value="COCINERO">Cocinero</option>
                  <option value="RECEPCIONISTA">Recepcionista</option>
                  <option value="REPARTIDOR">Repartidor</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </label>
              <label className={styles.userField}>
                <span>
                  {editingUser ? 'Nueva contraseña' : 'Contraseña inicial'}
                  {editingUser && <small>Opcional</small>}
                </span>
                <span className={styles.passwordInput}>
                  <input
                    autoComplete="new-password"
                    type={showUserPassword ? 'text' : 'password'}
                    minLength={6}
                    placeholder={
                      editingUser
                        ? 'Dejar vacío para mantener la actual'
                        : 'Mínimo 6 caracteres'
                    }
                    value={userForm.password}
                    onChange={(event) =>
                      setUserForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    aria-label={
                      showUserPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                    aria-pressed={showUserPassword}
                    onClick={() =>
                      setShowUserPassword((current) => !current)
                    }
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  </button>
                </span>
                <small className={styles.userFieldHint}>
                  Mínimo 6 caracteres. Comparte la contraseña de manera segura.
                </small>
              </label>
              <label className={styles.userActiveToggle}>
                <input
                  type="checkbox"
                  checked={userForm.active}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />
                <span className={styles.userToggleTrack} aria-hidden="true" />
                Empleado activo (habilitado para iniciar sesión)
              </label>
              {usernameError && (
                <p className={styles.userFormError} role="alert">
                  {usernameError}
                </p>
              )}
              {error && (
                <p className={styles.userFormError} role="alert">
                  {error}
                </p>
              )}
              <footer className={styles.userDialogFooter}>
                <button
                  type="button"
                  className={styles.userCancelButton}
                  onClick={closeUserForm}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.userSaveButton}>
                  {editingUser ? 'Guardar cambios' : 'Guardar empleado'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {successMessage && (
        <div
          className={modalStyles.modalBackdrop}
          onClick={() => setSuccessMessage('')}
        >
          <section
            className={modalStyles.tableModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-success-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="admin-success-title">Guardado correctamente</h2>
              <p>{successMessage}</p>
            </header>
            <div className={modalStyles.modalActions}>
              <button onClick={() => setSuccessMessage('')}>Aceptar</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}