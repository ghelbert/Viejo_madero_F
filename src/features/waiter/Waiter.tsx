import { useEffect, useState } from 'react'
import styles from './Waiter.module.css'
import {
  api,
  type Order,
  type OrderItem,
  type Product,
  type Table,
  type TableDetail,
  type User,
} from '../../api'
import type { Cart } from '../../types/role'
import { money } from '../../utils/format'
import { Header } from '../../components/Header'
import modalStyles from '../../components/Modal.module.css'

export function Waiter({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tables, setTables] = useState<Table[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [readyOrders, setReadyOrders] = useState<Order[]>([])
  const [readyItems, setReadyItems] = useState<Record<number, OrderItem[]>>({})
  const [selected, setSelected] = useState<Table | null>(null)
  const [busyTable, setBusyTable] = useState<TableDetail | null>(null)
  const [orderSuccessTable, setOrderSuccessTable] = useState<string | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null)
  const [cart, setCart] = useState<Cart>({})
  const [customerName, setCustomerName] = useState('')
  const [customerNameError, setCustomerNameError] = useState('')
  const [cartError, setCartError] = useState('')
  const [message, setMessage] = useState('')

  const loadReadyOrders = async () => {
    const orders = await api.orders('READY')
    const details = await Promise.all(
      orders.map((order) => api.orderDetail(order.id)),
    )
    setReadyOrders(orders)
    setReadyItems(
      Object.fromEntries(details.map((detail) => [detail.id, detail.items])),
    )
  }

  useEffect(() => {
    Promise.all([api.tables(), api.products(), loadReadyOrders()])
      .then(([loadedTables, loadedProducts]) => {
        setTables(loadedTables as Table[])
        setProducts(loadedProducts as Product[])
      })
      .catch((error) => setMessage(error.message))

    const refresh = () => {
      void loadReadyOrders().catch((error) => setMessage(error.message))
    }
    const interval = window.setInterval(refresh, 3000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const add = (id: number) => {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }))
    setCartError('')
  }

  const decrease = (id: number) =>
    setCart((current) => {
      const next = { ...current }
      if ((next[id] ?? 0) <= 1) delete next[id]
      else next[id] -= 1
      return next
    })

  const remove = (id: number) =>
    setCart((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })

  const cartProducts = products.filter((product) => cart[product.id])
  const total = cartProducts.reduce(
    (sum, product) => sum + Number(product.base_price) * cart[product.id],
    0,
  )

  const save = async () => {
    if (!selected) return
    const hasCustomerName = Boolean(customerName.trim())
    const hasCartItems = cartProducts.length > 0
    setCustomerNameError(
      hasCustomerName
        ? ''
        : 'Ingresa el nombre del cliente para registrar el pedido.',
    )
    setCartError(hasCartItems ? '' : 'Selecciona al menos un plato para el pedido.')
    if (!hasCustomerName || !hasCartItems) return
    const items = cartProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      price: Number(product.base_price),
      quantity: cart[product.id],
      notes: '',
    }))
    try {
      if (editingOrderId)
        await api.updateOrderItems(editingOrderId, customerName.trim(), items)
      else {
        await api.createOrder(selected.id, user.id, customerName.trim(), items)
        setOrderSuccessTable(selected.code)
      }
      if (editingOrderId) setMessage(`Pedido de mesa ${selected.code} actualizado.`)
    } catch (saveError) {
      setMessage(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo registrar el pedido. Inténtalo nuevamente.',
      )
      return
    }
    setCart({})
    setCustomerName('')
    setEditingOrderId(null)
    setSelected(null)
    setTables(await api.tables())
  }

  const editBusyOrder = () => {
    if (!busyTable) return
    setSelected(busyTable.table)
    setBusyTable(null)
    setEditingOrderId(busyTable.order.id)
    setCustomerName(busyTable.order.customer_name ?? '')
    setCart(
      Object.fromEntries(
        busyTable.order.items.map((item) => [item.product_id, item.quantity]),
      ),
    )
  }

  const releaseBusyTable = async () => {
    if (
      !busyTable ||
      !window.confirm(
        '¿Los clientes se retiraron? La mesa quedará libre y sus pedidos se cerrarán.',
      )
    )
      return
    await api.deleteOrder(busyTable.order.id)
    setBusyTable(null)
    setTables(await api.tables())
    setMessage(`Mesa ${busyTable.table.code} liberada`)
  }

  const selectTable = async (table: Table) => {
    setMessage('')
    if (table.status === 'FREE') {
      setSelected(table)
      return
    }
    try {
      setBusyTable(await api.tableDetail(table.id))
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar el detalle de la mesa',
      )
    }
  }

  const closeBusyTable = () => setBusyTable(null)

  const serve = async (order: Order) => {
    await api.updateOrder(order.id, 'SERVED', user.id)
    await Promise.all([loadReadyOrders(), api.tables().then(setTables)])
  }

  const renderReadyOrders = () => (
    <section className={styles.readySection}>
      <div className={styles.readyHeading}>
        <div className={styles.waiterSectionTitle}>
          <span className={styles.readyIcon}>♧</span>
          <h2>Listos para entregar</h2>
          <span className={styles.countBadge}>{readyOrders.length}</span>
        </div>
        <button
          className={styles.refreshReady}
          onClick={() => void loadReadyOrders()}
          aria-label="Actualizar pedidos listos"
        >
          Actualizar
        </button>
      </div>
      {readyOrders.length === 0 ? (
        <p className={styles.emptyReady}>No hay pedidos listos para entregar.</p>
      ) : (
        <div className={styles.readyOrders}>
          {readyOrders.map((order) => (
            <article className={styles.readyOrderCard} key={order.id}>
              <div className={styles.readyOrderHeader}>
                <strong>#{String(order.id).padStart(3, "0")}</strong>
                <span>Mesa {order.table_code}</span>
              </div>
              {order.customer_name && <small>{order.customer_name}</small>}
              <div className={styles.readyOrderItems}>
                {(readyItems[order.id] ?? []).map((item) => (
                  <div key={item.product_id}>
                    <b>{item.quantity}x</b>
                    <span>{item.product_name}</span>
                    <span>{money(Number(item.line_total))}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => void serve(order)}>Servir a la mesa</button>
            </article>
          ))}
        </div>
      )}
    </section>
  )

  /* --- Vista: registrar/editar pedido --- */
  if (selected)
    return (
      <>
        <Header user={user} onLogout={onLogout} />
        <main className={styles.orderContent}>
          {message && (
            <p className={styles.waiterNotification} role="status">
              {message}
            </p>
          )}
          <button className={styles.backButton} onClick={() => setSelected(null)}>
            ← Volver a mesas
          </button>
          <div className={styles.orderTitle}>
            <h1>Mesa {selected.code}</h1>
            <span>{selected.status === 'FREE' ? 'Disponible' : 'Ocupada'}</span>
          </div>
          <label className={styles.customerField}>
            Nombre del cliente
            <input
              value={customerName}
              onChange={(event) => {
                const value = event.target.value
                setCustomerName(value)
                if (value.trim()) setCustomerNameError('')
              }}
              placeholder="Ej. Ana García"
              maxLength={120}
              aria-invalid={Boolean(customerNameError)}
              aria-describedby={customerNameError ? 'customer-name-error' : undefined}
              required
            />
            {customerNameError && (
              <span className={styles.fieldError} id="customer-name-error" role="alert">
                {customerNameError}
              </span>
            )}
          </label>
          <div className={styles.orderLayout}>
            <div className={styles.menuList}>
              {products.map((product) => (
                <button
                  className={styles.menuItem}
                  key={product.id}
                  onClick={() => add(product.id)}
                >
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.description}</small>
                  </span>
                  <b>{money(Number(product.base_price))}</b>
                  <em>+</em>
                </button>
              ))}
            </div>
            <aside className={styles.cartPanel}>
              <h2>Pedido</h2>
              {cartProducts.map((product) => (
                <div className={styles.cartItem} key={product.id}>
                  <span>{cart[product.id]}x</span>
                  <strong>{product.name}</strong>
                  <div className={styles.cartActions}>
                    <button
                      type="button"
                      onClick={() => decrease(product.id)}
                      aria-label={`Disminuir ${product.name}`}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => add(product.id)}
                      aria-label={`Aumentar ${product.name}`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(product.id)}
                      aria-label={`Eliminar ${product.name}`}
                    >
                      x
                    </button>
                  </div>
                  <b>{money(Number(product.base_price) * cart[product.id])}</b>
                </div>
              ))}
              {!cartProducts.length && (
                <p className={styles.emptyCart}>Agrega platos desde la carta.</p>
              )}
              {cartError && (
                <p className={styles.fieldError} role="alert">
                  {cartError}
                </p>
              )}
              <div className={styles.cartTotal}>
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
              <button
                className={styles.submitOrderButton}
                onClick={save}
              >
                {editingOrderId ? 'Actualizar pedido' : 'Registrar pedido'}
              </button>
            </aside>
          </div>
        </main>
      </>
    )

  /* --- Vista: listado de mesas --- */
  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <main className={styles.waiterContent}>
        {renderReadyOrders()}
        <section className={styles.tablesSection}>
          <div className={styles.tablesHeading}>
            <div className={styles.waiterSectionTitle}>
              <span className={styles.tablesIcon}>▣</span>
              <h2>Mesas del salón</h2>
            </div>
          </div>
          <p>Selecciona una mesa para registrar un pedido.</p>
          {message && (
            <p className={styles.waiterNotification} role="status">
              {message}
            </p>
          )}
          <div className={styles.waiterTableGrid}>
            {tables.map((table) => (
              <button
                className={styles.waiterTableCard}
                key={table.id}
                onClick={() => void selectTable(table)}
              >
                <span className={styles.chairIcon}><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="lucide lucide-armchair size-7 text-primary"
                  aria-hidden="true"
                >
                  <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"></path>
                  <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"></path>
                  <path d="M5 18v2"></path>
                  <path d="M19 18v2"></path>
                </svg></span>
                <strong>{table.code}</strong>
                <span className={styles.waiterStatus}>
                  {table.status === 'FREE' ? 'Libre' : 'Ocupada'}
                </span>
                {table.customer_name && (
                  <small className={styles.tableCustomer}>
                    {table.customer_name}
                  </small>
                )}
              </button>
            ))}
          </div>
        </section>
      </main>
      {busyTable && (
        <div className={modalStyles.modalBackdrop} onClick={closeBusyTable}>
          <section
            className={modalStyles.tableModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="busy-table-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="busy-table-title">Mesa {busyTable.table.code}</h2>
              <button
                className={modalStyles.modalClose}
                onClick={closeBusyTable}
                aria-label="Cerrar"
              >
                x
              </button>
              <p>Detalle de lo que está consumiendo la mesa.</p>
            </header>
            <div className={modalStyles.modalTotal}>
              <span>Consumo total</span>
              <strong>{money(Number(busyTable.order.total))}</strong>
            </div>
            <article className={modalStyles.modalOrder}>
              <div className={modalStyles.modalOrderHeader}>
                <strong>#{String(busyTable.order.id).padStart(3, '0')}</strong>
                <span>
                  {busyTable.order.status === 'SERVED'
                    ? 'Servido'
                    : busyTable.order.status}
                </span>
              </div>
              {busyTable.order.customer_name && (
                <small>Cliente: {busyTable.order.customer_name}</small>
              )}
              {busyTable.order.items.map((item) => (
                <div className={modalStyles.modalItem} key={item.product_id}>
                  <strong>{item.quantity}x</strong>
                  <span>{item.product_name}</span>
                  <span>{money(Number(item.line_total))}</span>
                </div>
              ))}
              <div className={modalStyles.modalSubtotal}>
                <span>Subtotal</span>
                <strong>{money(Number(busyTable.order.total))}</strong>
              </div>
            </article>
            <div className={modalStyles.modalActions}>
              <button onClick={editBusyOrder}>
                + &nbsp;Agregar pedido a esta mesa
              </button>
              <button
                className={modalStyles.releaseButton}
                onClick={() => void releaseBusyTable()}
              >
                Liberar mesa
              </button>
            </div>
          </section>
        </div>
      )}
      {orderSuccessTable && (
        <div
          className={modalStyles.modalBackdrop}
          onClick={() => setOrderSuccessTable(null)}
        >
          <section
            className={modalStyles.tableModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-success-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="order-success-title">Pedido registrado</h2>
              <p>El pedido de la mesa {orderSuccessTable} se registró correctamente.</p>
            </header>
            <div className={modalStyles.modalActions}>
              <button onClick={() => setOrderSuccessTable(null)}>Aceptar</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}