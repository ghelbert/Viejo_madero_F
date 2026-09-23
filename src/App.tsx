import { useEffect, useState } from 'react'
import styles from './App.module.css'
import { api, type Order, type Product, type Table, type User } from './api'

type Role = 'ADMINISTRADOR' | 'MOZO' | 'COCINERO'
type Cart = Record<number, number>

const money = (value: number) => `S/ ${Number(value).toFixed(2)}`
const roleLabel: Record<Role, string> = { ADMINISTRADOR: 'Administrador', MOZO: 'Mozo', COCINERO: 'Cocinero' }

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try { onLogin(await api.login(username, password)) } catch { setError('Usuario o contraseña incorrectos') } finally { setLoading(false) }
  }
  return <main className={styles.loginShell}>
    <section className={styles.loginStory}><div className={styles.storyContent}><div className={styles.loginBrand}><span className={styles.brandMark}>VM</span><strong>El Viejo Madero</strong></div><div className={styles.storyCopy}><h1>Cocina de leña,<br />servicio de siempre.</h1><p>Pedidos en salón, coordinación de cocina y gestión de la carta en un solo lugar.</p></div><span className={styles.storyCaption}>Sistema de gestión interno</span></div></section>
    <section className={styles.loginPanel}><div className={styles.loginFormWrap}><div className={styles.referenceBrand}><span className={styles.referenceLogo}>VM</span><strong>El Viejo Madero</strong></div><h2>Iniciar sesión</h2><p className={styles.loginIntro}>Ingresa con tu usuario para continuar.</p><form className={styles.loginForm} onSubmit={submit}><label htmlFor="username">Usuario</label><input id="username" type="text" value={username} onChange={event => setUsername(event.target.value)} required /><label htmlFor="password">Contraseña</label><input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} required />{error && <p className={styles.loginError}>{error}</p>}<button className={styles.loginButton} disabled={loading}>{loading ? 'Validando...' : 'Entrar'}</button></form><p className={styles.demoAccess}>Usuarios iniciales: <b>admin</b>, <b>mozo</b> y <b>cocina</b>.</p></div></section>
  </main>
}

function Header({ user, onLogout }: { user: User; onLogout: () => void }) {
  return <header className={styles.waiterHeader}><div className={styles.waiterBrand}><span className={styles.waiterLogo}>VM</span><div><strong>El Viejo Madero</strong><small>{roleLabel[user.role as Role]} · {user.fullName}</small></div></div><button className={styles.logoutButton} onClick={onLogout}>Salir</button></header>
}

function Waiter({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tables, setTables] = useState<Table[]>([]); const [products, setProducts] = useState<Product[]>([]); const [selected, setSelected] = useState<Table | null>(null); const [cart, setCart] = useState<Cart>({}); const [message, setMessage] = useState('')
  useEffect(() => { Promise.all([api.tables(), api.products()]).then(([loadedTables, loadedProducts]) => { setTables(loadedTables); setProducts(loadedProducts) }).catch(error => setMessage(error.message)) }, [])
  const add = (id: number) => setCart(current => ({ ...current, [id]: (current[id] ?? 0) + 1 }))
  const cartProducts = products.filter(product => cart[product.id]); const total = cartProducts.reduce((sum, product) => sum + Number(product.base_price) * cart[product.id], 0)
  const save = async () => { if (!selected || !cartProducts.length) return; await api.createOrder(selected.id, user.id, cartProducts.map(product => ({ productId: product.id, productName: product.name, price: Number(product.base_price), quantity: cart[product.id], notes: '' }))); setMessage('Pedido registrado y listo para confirmar'); setCart({}); setSelected(null); setTables(await api.tables()) }
  if (selected) return <><Header user={user} onLogout={onLogout} /><main className={styles.orderContent}><button className={styles.backButton} onClick={() => setSelected(null)}>← Volver a mesas</button><div className={styles.orderTitle}><h1>Mesa {selected.code}</h1><span>{selected.status === 'FREE' ? 'Disponible' : 'Ocupada'}</span></div><div className={styles.orderLayout}><div className={styles.menuList}>{products.map(product => <button className={styles.menuItem} key={product.id} onClick={() => add(product.id)}><span><strong>{product.name}</strong><small>{product.description}</small></span><b>{money(Number(product.base_price))}</b><em>+</em></button>)}</div><aside className={styles.cartPanel}><h2>Pedido</h2>{cartProducts.map(product => <div className={styles.cartItem} key={product.id}><span>{cart[product.id]}x</span><strong>{product.name}</strong><b>{money(Number(product.base_price) * cart[product.id])}</b></div>)}{!cartProducts.length && <p className={styles.emptyCart}>Agrega platos desde la carta.</p>}<div className={styles.cartTotal}><span>Total</span><strong>{money(total)}</strong></div><button className={styles.loginButton} disabled={!cartProducts.length} onClick={save}>Registrar pedido</button></aside></div></main></>
  return <><Header user={user} onLogout={onLogout} /><main className={styles.waiterContent}><section className={styles.waiterIntro}><h1>Mesas del salón</h1><p>Selecciona una mesa para registrar un pedido.</p>{message && <p>{message}</p>}</section><div className={styles.waiterTableGrid}>{tables.map(table => <button className={styles.waiterTableCard} key={table.id} onClick={() => setSelected(table)}><span className={styles.chairIcon}>▱</span><strong>{table.code}</strong><span className={styles.waiterStatus}>{table.status === 'FREE' ? 'Libre' : table.status}</span><small>{table.capacity} personas · {table.zone}</small></button>)}</div></main></>
}

function Kitchen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]); const [error, setError] = useState('')
  const load = () => api.orders().then(setOrders).catch(error => setError(error.message))
  useEffect(() => { void load() }, [])
  const move = async (order: Order, status: string) => { await api.updateOrder(order.id, status, user.id); await load() }
  const columns = [['CONFIRMED', 'Nuevos', 'IN_KITCHEN'], ['IN_KITCHEN', 'En preparación', 'READY'], ['READY', 'Listos', 'SERVED']]
  return <><Header user={user} onLogout={onLogout} /><main className={styles.kitchenContent}><section className={styles.kitchenIntro}><h1>Cocina — comandas</h1><p>Actualiza el estado a medida que avanza cada pedido.</p>{error && <p>{error}</p>}</section><section className={styles.kitchenBoard}>{columns.map(([status, title, next]) => <article className={styles.kitchenColumn} key={status}><div className={styles.kitchenColumnHeading}><h2>{title}</h2><span className={styles.kitchenCount}>{orders.filter(order => order.status === status).length}</span></div>{orders.filter(order => order.status === status).map(order => <div className={styles.kitchenCard} key={order.id}><strong>{order.code} · Mesa {order.table_code}</strong><span>{money(Number(order.total))}</span><button onClick={() => move(order, next)}>{next === 'IN_KITCHEN' ? 'Tomar pedido' : next === 'READY' ? 'Marcar listo' : 'Entregar'}</button></div>)}</article>)}</section></main></>
}

function Admin({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [users, setUsers] = useState<Array<User & { active: boolean }>>([]); const [orders, setOrders] = useState<Order[]>([]); const [products, setProducts] = useState<Product[]>([]); const [tab, setTab] = useState('Resumen'); const [error, setError] = useState('')
  const load = () => Promise.all([api.users(), api.orders(), api.products()]).then(([loadedUsers, loadedOrders, loadedProducts]) => { setUsers(loadedUsers); setOrders(loadedOrders); setProducts(loadedProducts) }).catch(error => setError(error.message))
  useEffect(() => { void load() }, [])
  return <><Header user={user} onLogout={onLogout} /><main className={styles.adminContent}><div className={styles.adminIntro}><div><h1>Administración</h1><p>Usuarios, roles, carta y operación del restaurante.</p></div><nav className={styles.adminTabs}>{['Resumen', 'Carta', 'Empleados'].map(item => <button key={item} className={tab === item ? styles.adminTabActive : ''} onClick={() => setTab(item)}>{item}</button>)}</nav></div>{error && <p>{error}</p>}{tab === 'Resumen' ? <section className={styles.adminStats}><div className={styles.adminStat}><div><small>Pedidos activos</small><strong>{orders.filter(order => !['SERVED', 'CANCELLED'].includes(order.status)).length}</strong></div></div><div className={styles.adminStat}><div><small>Usuarios activos</small><strong>{users.filter(item => item.active).length}</strong></div></div><div className={styles.adminStat}><div><small>Ventas registradas</small><strong>{money(orders.reduce((sum, order) => sum + Number(order.total), 0))}</strong></div></div></section> : tab === 'Carta' ? <section className={styles.adminOrders}><h2>Platos y disponibilidad</h2><div className={styles.adminTableWrap}><table className={styles.adminTable}><thead><tr><th>Plato</th><th>Categoría</th><th>Precio</th><th>Disponible</th><th></th></tr></thead><tbody>{products.map(product => <tr key={product.id}><th>{product.name}</th><td>{product.category}</td><td>{money(Number(product.base_price))}</td><td>{product.available === false ? 'No' : 'Sí'}</td><td><button onClick={async () => { await api.updateProduct(product, product.available === false); await load() }}>{product.available === false ? 'Activar' : 'Desactivar'}</button></td></tr>)}</tbody></table></div></section> : <section className={styles.adminOrders}><h2>Usuarios y roles</h2><div className={styles.adminTableWrap}><table className={styles.adminTable}><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>{users.map(item => <tr key={item.id}><th>{item.fullName}</th><td>{item.username}</td><td>{roleLabel[item.role as Role] ?? item.role}</td><td>{item.active ? 'Activo' : 'Inactivo'}</td><td><button onClick={async () => { await api.toggleUser(item.id, !item.active); await load() }}>{item.active ? 'Desactivar' : 'Activar'}</button></td></tr>)}</tbody></table></div></section>}</main></>
}

function App() {
  const [user, setUser] = useState<User | null>(() => { const stored = localStorage.getItem('restaurant-user'); return stored ? JSON.parse(stored) : null })
  const logout = () => { localStorage.removeItem('restaurant-user'); setUser(null) }
  const login = (nextUser: User) => { localStorage.setItem('restaurant-user', JSON.stringify(nextUser)); setUser(nextUser) }
  if (!user) return <Login onLogin={login} />
  if (user.role === 'MOZO') return <Waiter user={user} onLogout={logout} />
  if (user.role === 'COCINERO') return <Kitchen user={user} onLogout={logout} />
  return <Admin user={user} onLogout={logout} />
}

export default App
