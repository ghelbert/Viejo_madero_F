import { useEffect, useState } from 'react'
import styles from '../../App.module.css'
import { api, type Order, type Product, type User } from '../../api'
import type { Role } from '../../types/role'
import { money, roleLabel } from '../../utils/format'
import { Header } from '../../components/Header'

const usernamePrefix = (role: string) => role.slice(0, 2).toUpperCase()
const duplicateUsernameMessage = 'Ese nombre de usuario ya está registrado.'

const usernameWithoutPrefix = (username: string, role: string) => {
  const prefix = usernamePrefix(role)
  return username.toUpperCase().startsWith(prefix)
    ? username.slice(prefix.length)
    : username
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
    password: '',
    role: 'MOZO',
  })

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
      username: `${usernamePrefix(userForm.role)}${userForm.username.trim()}`,
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
        setSuccessMessage('Empleado creado correctamente.')
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo guardar el empleado.'
      if (message === duplicateUsernameMessage) setUsernameError(message)
      else setError(message)
      return
    }
    setEditingUser(null)
    setUserForm({ fullName: '', username: '', password: '', role: 'MOZO' })
    setShowUserForm(false)
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
        {error && <p className={styles.loginError}>{error}</p>}

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
                onClick={() => {
                  setEditingUser(null)
                  setUserForm({
                    fullName: '',
                    username: '',
                    password: '',
                    role: 'MOZO',
                  })
                  setShowUserForm((current) => !current)
                }}
              >
                {showUserForm ? 'Cancelar' : 'Nuevo empleado'}
              </button>
            </div>
            {showUserForm && (
              <form className={styles.adminForm} onSubmit={createUser}>
                <input
                  placeholder="Nombre completo"
                  value={userForm.fullName}
                  onChange={(event) =>
                    setUserForm({ ...userForm, fullName: event.target.value })
                  }
                  required
                />
                <input
                  placeholder="Usuario"
                  value={`${usernamePrefix(userForm.role)}${userForm.username}`}
                  onChange={(event) =>
                    {
                      setUsernameError('')
                      setUserForm({
                        ...userForm,
                        username: usernameWithoutPrefix(
                          event.target.value,
                          userForm.role,
                        ),
                      })
                    }
                  }
                  required
                />
                <input
                  type="password"
                  placeholder={
                    editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'
                  }
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm({ ...userForm, password: event.target.value })
                  }
                  required={!editingUser}
                />
                <select
                  value={userForm.role}
                  onChange={(event) =>
                    {
                      setUsernameError('')
                      setUserForm({ ...userForm, role: event.target.value })
                    }
                  }
                >
                  <option value="MOZO">Mozo</option>
                  <option value="COCINERO">Cocinero</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
                <button className={styles.adminActionButton}>
                  {editingUser ? 'Guardar cambios' : 'Guardar empleado'}
                </button>
              </form>
            )}
            <div className={styles.adminTableWrap}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      <th>{item.full_name}</th>
                      <td>{item.username}</td>
                      <td>{roleLabel[item.role as Role] ?? item.role}</td>
                      <td>{item.active ? 'Activo' : 'Inactivo'}</td>
                      <td>
                        <button
                          onClick={() => {
                            setEditingUser(item)
                            setUserForm({
                              fullName: item.full_name,
                              username: usernameWithoutPrefix(
                                item.username,
                                item.role,
                              ),
                              password: '',
                              role: item.role,
                            })
                            setShowUserForm(true)
                          }}
                        >
                          Editar
                        </button>{' '}
                        <button
                          onClick={async () => {
                            await api.toggleUser(item.id, !item.active)
                            await load()
                          }}
                        >
                          {item.active ? 'Desactivar' : 'Activar'}
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
      {usernameError && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setUsernameError('')}
        >
          <section
            className={styles.tableModal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="duplicate-username-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="duplicate-username-title">Nombre de usuario en uso</h2>
              <p>{usernameError}</p>
            </header>
            <div className={styles.modalActions}>
              <button onClick={() => setUsernameError('')}>Aceptar</button>
            </div>
          </section>
        </div>
      )}
      {successMessage && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSuccessMessage('')}
        >
          <section
            className={styles.tableModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-success-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="admin-success-title">Guardado correctamente</h2>
              <p>{successMessage}</p>
            </header>
            <div className={styles.modalActions}>
              <button onClick={() => setSuccessMessage('')}>Aceptar</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}