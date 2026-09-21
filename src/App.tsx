import { useState } from 'react'
import styles from './App.module.css'

type TableStatus = 'Ocupada' | 'Disponible' | 'Reservada'
type UserRole = 'Mozo' | 'Recepcionista' | 'Cocinero' | 'Repartidor' | 'Administrador'
type RestaurantTable = { number: string; seats: number; status: TableStatus; time?: string; amount?: string; guest?: string }

const tables: RestaurantTable[] = [
  { number: '01', seats: 2, status: 'Ocupada', time: '19:20', amount: '$ 48.500', guest: 'Mesa para dos' },
  { number: '02', seats: 4, status: 'Disponible' },
  { number: '03', seats: 4, status: 'Ocupada', time: '19:42', amount: '$ 72.800', guest: 'Familia Rodríguez' },
  { number: '04', seats: 6, status: 'Reservada', time: '21:00', guest: 'Reserva • 6 personas' },
  { number: '05', seats: 2, status: 'Disponible' },
  { number: '06', seats: 4, status: 'Ocupada', time: '20:05', amount: '$ 91.200', guest: 'Cumpleaños' },
  { number: '07', seats: 8, status: 'Ocupada', time: '20:18', amount: '$ 156.400', guest: 'Mesa de Federico' },
  { number: '08', seats: 2, status: 'Disponible' },
]

const orderItems = [
  { quantity: 2, name: 'Bife de chorizo', note: 'Punto medio', price: '$ 64.000' },
  { quantity: 1, name: 'Provoleta al rescoldo', note: 'Sin morrones', price: '$ 18.500' },
  { quantity: 2, name: 'Agua con gas', note: '', price: '$ 7.800' },
]

const icon = (symbol: string) => <span aria-hidden="true" className={styles.icon}>{symbol}</span>

const waiterTables = [
  { number: 1, status: 'Ocupada', elapsed: 'Superó 20 min', amount: '$ 78.00' },
  { number: 2, status: 'Libre' },
  { number: 3, status: 'Libre' },
  { number: 4, status: 'Libre' },
  { number: 5, status: 'Libre' },
  { number: 6, status: 'Libre' },
  { number: 7, status: 'Libre' },
  { number: 8, status: 'Libre' },
]

type MenuItem = { name: string; description: string; price: number }
type MenuCategory = { name: string; items: MenuItem[] }

const menuCategories: MenuCategory[] = [
  { name: 'Combos broaster', items: [
    { name: '1/4 Pollo Broaster Clásico', description: 'Pollo crujiente, papas fritas y ensalada fresca', price: 24 },
    { name: '1/2 Pollo Broaster Familiar', description: 'Medio pollo crocante, papas, ensalada y cremas', price: 42 },
    { name: 'Pollo Broaster Entero', description: 'Pollo entero dorado con papas familiares y ensalada', price: 78 },
    { name: 'Combo Tiras Crocantes', description: 'Tiras de pollo, papas fritas, ensalada y crema de la casa', price: 22 },
  ] },
  { name: 'Especialidades', items: [
    { name: 'Alitas BBQ Crocantes', description: 'Alitas doradas bañadas en salsa BBQ y papas fritas', price: 23 },
    { name: 'Hamburguesa de Pollo Crispy', description: 'Filete crispy, queso, lechuga, tomate y papas', price: 21 },
  ] },
  { name: 'Acompañamientos', items: [
    { name: 'Porción de Papas Fritas', description: 'Papas doradas con ketchup y mayonesa de la casa', price: 9 },
    { name: 'Ensalada Fresca', description: 'Lechuga, tomate, pepino y aderezo de la casa', price: 8 },
  ] },
  { name: 'Bebidas', items: [
    { name: 'Gaseosa Inka Kola 500 ml', description: 'Gaseosa personal bien fría', price: 6 },
    { name: 'Chicha Morada de la Casa', description: 'Vaso de chicha morada natural con canela y limón', price: 7 },
    { name: 'Maracuyá Frozen', description: 'Bebida frozen de maracuyá preparada al momento', price: 10 },
  ] },
  { name: 'Postres', items: [
    { name: 'Brownie con Helado', description: 'Brownie tibio de chocolate con helado de vainilla', price: 14 },
  ] },
]

function formatPrice(price: number) {
  return `S/ ${price.toFixed(2)}`
}

function WaiterOrderView({ tableNumber, onBack }: { tableNumber: number; onBack: () => void }) {
  const [customerName, setCustomerName] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const cartItems = menuCategories.flatMap((category) => category.items).filter((item) => cart[item.name])
  const total = cartItems.reduce((sum, item) => sum + item.price * cart[item.name], 0)

  const addItem = (item: MenuItem) => setCart((current) => ({ ...current, [item.name]: (current[item.name] ?? 0) + 1 }))

  return (
    <div className={styles.waiterShell}>
      <header className={styles.waiterHeader}>
        <div className={styles.waiterBrand}><span className={styles.waiterLogo}>{icon('♧')}</span><div><strong>El Viejo Madero</strong><small>Mozo · Carlos Ramos</small></div></div>
        <button className={styles.logoutButton} onClick={onBack}>{icon('↪')} Salir</button>
      </header>
      <main className={styles.orderContent}>
        <button className={styles.backButton} onClick={onBack}>{icon('←')} Volver</button>
        <div className={styles.orderTitle}><h1>Mesa {tableNumber}</h1><span>Salón</span></div>
        <label className={styles.customerField}>Nombre del cliente<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Ej. Juan Pérez" /></label>
        <div className={styles.orderLayout}>
          <div className={styles.menuList}>{menuCategories.map((category) => <section key={category.name} className={styles.menuCategory}><h2>{category.name}</h2>{category.items.map((item) => <button className={styles.menuItem} key={item.name} onClick={() => addItem(item)}><span><strong>{item.name}</strong><small>{item.description}</small></span><b>{formatPrice(item.price)}</b><em>+</em></button>)}</section>)}</div>
          <aside className={styles.cartPanel}><h2>Pedido</h2>{cartItems.length === 0 ? <p className={styles.emptyCart}>Aún no agregaste platos. Toca un plato para añadirlo.</p> : <div className={styles.cartItems}>{cartItems.map((item) => <div className={styles.cartItem} key={item.name}><span>{cart[item.name]}x</span><strong>{item.name}</strong><b>{formatPrice(item.price * cart[item.name])}</b></div>)}</div>}<div className={styles.cartTotal}><span>Total</span><strong>{formatPrice(total)}</strong></div></aside>
        </div>
      </main>
      <footer className={styles.orderFooter}><span>Puedes editar el pedido antes de enviarlo. Total <strong>{formatPrice(total)}</strong></span><button disabled={cartItems.length === 0}>{icon('♜')} Confirmar y enviar a cocina</button></footer>
    </div>
  )
}

function WaiterView({ onLogout }: { onLogout: () => void }) {
  const [tableFilter, setTableFilter] = useState<'Todas' | 'Ocupadas' | 'Libres'>('Todas')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const visibleTables = waiterTables.filter((table) => tableFilter === 'Todas' || table.status === tableFilter.slice(0, -1))

  if (selectedTable !== null) return <WaiterOrderView tableNumber={selectedTable} onBack={() => setSelectedTable(null)} />

  return (
    <div className={styles.waiterShell}>
      <header className={styles.waiterHeader}>
        <div className={styles.waiterBrand}>
          <span className={styles.waiterLogo}>{icon('♧')}</span>
          <div><strong>El Viejo Madero</strong><small>Mozo · Carlos Ramos</small></div>
        </div>
        <button className={styles.logoutButton} onClick={onLogout}>{icon('↪')} Salir</button>
      </header>
      <main className={styles.waiterContent}>
        <section className={styles.waiterIntro}>
          <h1>Mozo</h1>
          <p>Entrega los platos listos, atiende las mesas y toma nuevos pedidos.</p>
        </section>
        <section className={styles.readySection} aria-labelledby="ready-title">
          <div className={styles.waiterSectionTitle}><span className={styles.readyIcon}>{icon('♧')}</span><h2 id="ready-title">Listos para entregar</h2><span className={styles.countBadge}>0</span></div>
          <div className={styles.emptyReady}>No hay platos listos en cocina por ahora.</div>
        </section>
        <section className={styles.tablesSection} aria-labelledby="tables-title">
          <div className={styles.tablesHeading}>
            <div><div className={styles.waiterSectionTitle}><span className={styles.tablesIcon}>{icon('▣')}</span><h2 id="tables-title">Mesas del salón</h2></div><p>Toca una mesa libre para tomar un pedido, u ocupada para ver su consumo.</p></div>
            <div className={styles.waiterFilters}>{(['Todas', 'Ocupadas', 'Libres'] as const).map((item) => <button key={item} className={tableFilter === item ? styles.waiterFilterActive : ''} onClick={() => setTableFilter(item)}>{item}</button>)}</div>
          </div>
          <div className={styles.waiterTableGrid}>{visibleTables.map((table) => <button key={table.number} className={`${styles.waiterTableCard} ${table.status === 'Ocupada' ? styles.waiterOccupied : ''}`} onClick={() => setSelectedTable(table.number)}><span className={styles.chairIcon}>{icon('▱')}</span><strong>Mesa {table.number}</strong><span className={`${styles.waiterStatus} ${table.status === 'Ocupada' ? styles.occupiedStatus : ''}`}>{table.status}</span>{table.elapsed && <span className={styles.elapsed}>{icon('◷')} {table.elapsed}</span>}{table.amount && <span className={styles.waiterAmount}>{table.amount}</span>}</button>)}</div>
        </section>
      </main>
    </div>
  )
}

const adminOrders = [
  { code: '#S31', type: 'Mesa 1', customer: 'RY', payment: '—', total: 'S/ 78.00' },
  { code: '#A25', type: 'Delivery', customer: 'a2', payment: 'Plin', total: 'S/ 42.00' },
  { code: '#D36', type: 'Delivery', customer: 'w', payment: 'Yape', total: 'S/ 24.00' },
]

function AdminView({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('Resumen')

  return (
    <div className={styles.adminShell}>
      <header className={styles.adminHeader}>
        <div className={styles.adminBrand}>
          <span className={styles.adminLogo}>{icon('♧')}</span>
          <div><strong>El Viejo Madero</strong><small>Administrador · Rosa Medina</small></div>
        </div>
        <button className={styles.adminLogout} onClick={onLogout}>{icon('↪')} Salir</button>
      </header>
      <main className={styles.adminContent}>
        <div className={styles.adminIntro}>
          <div><h1>Administración</h1><p>Operación, carta, empleados y resultados de El Viejo Madero.</p></div>
          <nav className={styles.adminTabs} aria-label="Secciones de administración">
            {['Resumen', 'Carta', 'Empleados', 'Reportes'].map((tab) => <button key={tab} className={activeTab === tab ? styles.adminTabActive : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </nav>
        </div>
        <section className={styles.adminStats} aria-label="Resumen de operación">
          <div className={styles.adminStat}><span className={styles.adminStatIcon}>{icon('♨')}</span><div><small>Pedidos totales</small><strong>3</strong></div></div>
          <div className={`${styles.adminStat} ${styles.adminStatEmphasis}`}><span className={styles.adminStatIcon}>{icon('⌁')}</span><div><small>Activos ahora</small><strong>3</strong></div></div>
          <div className={styles.adminStat}><span className={styles.adminStatIcon}>{icon('♧')}</span><div><small>Delivery</small><strong>2</strong></div></div>
          <div className={styles.adminStat}><span className={styles.adminStatIcon}>{icon('▱')}</span><div><small>Vendido (entregado)</small><strong>S/ 0.00</strong></div></div>
        </section>
        <section className={styles.adminOrders} aria-labelledby="recent-orders-title">
          <h2 id="recent-orders-title">Pedidos recientes</h2>
          <div className={styles.adminTableWrap}>
            <table className={styles.adminTable}><thead><tr><th>Código</th><th>Tipo</th><th>Cliente</th><th>Estado</th><th>Pago</th><th className={styles.adminTotalColumn}>Total</th></tr></thead><tbody>{adminOrders.map((order) => <tr key={order.code}><th scope="row">{order.code}</th><td>{order.type}</td><td>{order.customer}</td><td><span className={styles.newStatus}>Nuevo</span></td><td>{order.payment}</td><td className={styles.adminTotalColumn}>{order.total}</td></tr>)}</tbody></table>
          </div>
        </section>
      </main>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (role: UserRole) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const roleByUsername: Record<string, UserRole> = {
      mozo: 'Mozo',
      recepcion: 'Recepcionista',
      cocina: 'Cocinero',
      reparto: 'Repartidor',
      admin: 'Administrador',
    }
    onLogin(roleByUsername[username.toLowerCase()] ?? 'Mozo')
  }

  return (
    <main className={styles.loginShell}>
      <section className={styles.loginStory}>
        <div className={styles.storyContent}>
          <div className={styles.loginBrand}><span className={styles.brandMark}>♧</span><strong>El Viejo Madero</strong></div>
          <div className={styles.storyCopy}><h1>Cocina de leña,<br />servicio de siempre.</h1><p>Plataforma interna para tomar pedidos en salón y delivery, coordinar la cocina y las entregas, y gestionar la carta del restaurante.</p></div>
          <span className={styles.storyCaption}>Sistema de gestión interno · Prototipo</span>
        </div>
      </section>
      <section className={styles.loginPanel}>
        <div className={styles.loginFormWrap}>
          <div className={styles.referenceBrand}><span className={styles.referenceLogo}>{icon('♧')}</span><strong>El Viejo Madero</strong></div>
          <h2>Iniciar sesión</h2>
          <p className={styles.loginIntro}>Ingresa con tu usuario para ver tu vista de trabajo.</p>
          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <label htmlFor="username">Usuario</label>
            <input id="username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Ej. mozo" required />
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••" required />
            <button className={styles.loginButton} type="submit">{icon('⚔')} Entrar</button>
          </form>
          <div className={styles.demoAccess}><p>Accesos de prueba (contraseña 1234)</p>{[['Mozo', 'mozo'], ['Recepcionista', 'recepcion'], ['Cocinero', 'cocina'], ['Repartidor', 'reparto'], ['Administrador', 'admin']].map(([role, value]) => <div className={styles.demoRow} key={value}><span>{role} <small>· {value}</small></span><button type="button" onClick={() => { setUsername(value); setPassword('1234') }}>Usar</button></div>)}</div>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [activeSection, setActiveSection] = useState('Mesas')
  const [selectedTable, setSelectedTable] = useState('07')
  const [filter, setFilter] = useState<'Todas' | TableStatus>('Todas')
  const [query, setQuery] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>('Mozo')
  const visibleTables = tables.filter((table) => {
    const matchesFilter = filter === 'Todas' || table.status === filter
    const matchesQuery = table.number.includes(query) || table.guest?.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && (query === '' || matchesQuery)
  })

  if (!isAuthenticated) return <LoginScreen onLogin={(role) => { setUserRole(role); setIsAuthenticated(true) }} />
  if (userRole === 'Mozo') return <WaiterView onLogout={() => setIsAuthenticated(false)} />
  if (userRole === 'Administrador') return <AdminView onLogout={() => setIsAuthenticated(false)} />

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.brandMark}>VM</span><div><strong>Viejo Madero</strong><small>Gestión del restaurante</small></div></div>
        <p className={styles.menuLabel}>Principal</p>
        <nav className={styles.navigation} aria-label="Navegación principal">
          {['Resumen', 'Mesas', 'Pedidos', 'Carta'].map((item) => <button key={item} className={`${styles.navItem} ${activeSection === item ? styles.navItemActive : ''}`} onClick={() => setActiveSection(item)}>{icon(item === 'Resumen' ? '◫' : item === 'Mesas' ? '▦' : item === 'Pedidos' ? '≡' : '◌')}<span>{item}</span>{item === 'Pedidos' && <b>3</b>}</button>)}
        </nav>
        <p className={styles.menuLabel}>Administración</p>
        <nav className={styles.navigation} aria-label="Administración">
          <button className={styles.navItem} onClick={() => setActiveSection('Equipo')}>{icon('♧')}<span>Equipo</span></button>
          <button className={styles.navItem} onClick={() => setActiveSection('Reportes')}>{icon('▥')}<span>Reportes</span></button>
        </nav>
        <div className={styles.sidebarBottom}><div className={styles.helpCard}><span>?</span><div><strong>¿Necesitás ayuda?</strong><small>Ver centro de soporte</small></div></div><button className={styles.navItem}>{icon('↪')}<span>Cerrar sesión</span></button></div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}><button className={styles.mobileMenu} aria-label="Abrir menú">☰</button><div className={styles.breadcrumb}><span>Restaurante</span><i>/</i><strong>{activeSection}</strong></div><div className={styles.topbarActions}><button className={styles.iconButton} aria-label="Notificaciones">♧<span className={styles.notificationDot}></span></button><div className={styles.profile}><span className={styles.avatar}>MR</span><div><strong>Mateo Rodríguez</strong><small>{userRole}</small></div><span className={styles.chevron}>⌄</span></div></div></header>
        <div className={styles.content}>
          <section className={styles.welcome}><div><p className={styles.eyebrow}>Jueves, 24 de octubre de 2024</p><h1>Buenas tardes, Mateo <span>✦</span></h1><p className={styles.subtitle}>Este es el estado de tu turno. Todo bajo control.</p></div><button className={styles.primaryButton} onClick={() => setSelectedTable('07')}>{icon('+')} Nueva orden</button></section>
          <section className={styles.statsGrid} aria-label="Resumen del turno">
            <div className={styles.statCard}><span className={styles.statIcon} data-tone="green">▦</span><div><small>Mesas ocupadas</small><strong>4 <em>/ 8</em></strong></div><span className={styles.statTrend}>+2 hoy</span></div>
            <div className={styles.statCard}><span className={styles.statIcon} data-tone="orange">◷</span><div><small>Pedidos activos</small><strong>7</strong></div><span className={styles.statTrend}>+3 hoy</span></div>
            <div className={styles.statCard}><span className={styles.statIcon} data-tone="blue">$</span><div><small>Ventas del turno</small><strong>$ 1.284.500</strong></div><span className={styles.statTrend}>+12.5%</span></div>
            <div className={`${styles.statCard} ${styles.serviceCard}`}><span className={styles.servicePulse}></span><div><small>Estado del servicio</small><strong>Servicio activo</strong></div><button aria-label="Más información">•••</button></div>
          </section>
          <section className={styles.workspace}>
            <div className={styles.workspaceHeader}><div><div className={styles.tabs}><button className={activeSection === 'Mesas' ? styles.tabActive : ''} onClick={() => setActiveSection('Mesas')}>Mesas <span>8</span></button><button className={activeSection === 'Pedidos' ? styles.tabActive : ''} onClick={() => setActiveSection('Pedidos')}>Pedidos <span>7</span></button></div><p className={styles.sectionDescription}>Supervisá el estado de las mesas en tiempo real.</p></div><div className={styles.headerTools}><select aria-label="Seleccionar salón" defaultValue="Salón principal"><option>Salón principal</option><option>Terraza</option></select><button className={styles.filterButton}>{icon('≡')} Filtrar</button></div></div>
            <div className={styles.tableToolbar}><div className={styles.filters}>{(['Todas', 'Ocupada', 'Disponible', 'Reservada'] as const).map((item) => <button key={item} className={filter === item ? styles.filterActive : ''} onClick={() => setFilter(item)}>{item}{item === 'Todas' && <span>8</span>}</button>)}</div><label className={styles.search}>{icon('⌕')}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar mesa o cliente..." /></label></div>
            <div className={styles.tableArea}><div className={styles.tableGrid}>{visibleTables.map((table) => <button key={table.number} className={`${styles.tableCard} ${selectedTable === table.number ? styles.selectedTable : ''}`} onClick={() => setSelectedTable(table.number)}><div className={styles.tableCardTop}><span className={`${styles.statusDot} ${styles[table.status.toLowerCase()]}`}></span><span className={styles.statusText}>{table.status}</span><span className={styles.tableMore}>•••</span></div><div className={styles.tableNumber}>{table.number}</div><div className={styles.tableInfo}><span>{icon('♧')} {table.seats} personas</span>{table.time && <span>{icon('◷')} {table.time}</span>}</div>{table.guest ? <><div className={styles.guest}>{table.guest}</div>{table.amount && <strong className={styles.amount}>{table.amount}</strong>}</> : <span className={styles.emptyHint}>{table.status === 'Reservada' ? table.time : 'Lista para recibir clientes'}</span>}</button>)}</div><aside className={styles.orderPanel}><div className={styles.orderHeading}><div><p className={styles.eyebrow}>Pedido en curso</p><h2>Mesa {selectedTable}</h2></div><span className={styles.orderStatus}>En preparación</span></div><div className={styles.orderMeta}><span>{icon('♧')} 8 personas</span><span>{icon('◷')} Desde las 20:18</span></div><div className={styles.orderItems}>{orderItems.map((item) => <div className={styles.orderItem} key={item.name}><span className={styles.quantity}>{item.quantity}</span><div><strong>{item.name}</strong><small>{item.note}</small></div><span>{item.price}</span></div>)}</div><div className={styles.orderTotal}><span>Total estimado</span><strong>$ 156.400</strong></div><button className={styles.secondaryButton}>Ver pedido completo <span>→</span></button></aside></div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
