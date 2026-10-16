import { useEffect, useState } from 'react'
import styles from './Kitchen.module.css'
import { api, subscribeToOrderUpdates, type Order, type OrderItem, type User } from '../../api'
import { money } from '../../utils/format'
import { Header } from '../../components/Header'

export function Kitchen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [itemsByOrder, setItemsByOrder] = useState<Record<number, OrderItem[]>>({})
  const [error, setError] = useState('')
  const [now, setNow] = useState(0)

  const load = async () => {
    try {
      const loadedOrders = await api.orders()
      const details = await Promise.all(
        loadedOrders
          .filter((order) => ['OPEN', 'CONFIRMED', 'IN_KITCHEN', 'READY'].includes(order.status))
          .map((order) => api.orderDetail(order.id)),
      )
      setOrders(loadedOrders
        .filter((order) => ['OPEN', 'CONFIRMED', 'IN_KITCHEN', 'READY'].includes(order.status))
        .sort((a, b) => Date.parse(a.created_at ?? '') - Date.parse(b.created_at ?? '')))
      setItemsByOrder(
        Object.fromEntries(details.map((detail) => [detail.id, detail.items])),
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudieron cargar las comandas',
      )
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load)

    const refresh = () => void load()
    const unsubscribe = subscribeToOrderUpdates(refresh)
    window.addEventListener('focus', refresh)
    const initialClock = window.setTimeout(() => setNow(Date.now()), 0)
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', refresh)
      window.clearTimeout(initialClock)
      window.clearInterval(timer)
    }
  }, [])

  const move = async (order: Order, status: string) => {
    try {
      await api.updateOrder(order.id, status, user.id)
      await load()
      setError('')
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : 'No se pudo actualizar el pedido')
    }
  }

  const columns: Array<[string, string, string, string]> = [
    ['OPEN,CONFIRMED', 'Nuevos', 'IN_KITCHEN', 'Sin comandas nuevas'],
    ['IN_KITCHEN', 'En preparación', 'READY', 'Nada en preparación'],
    ['READY', 'Listos', 'READY', 'Aún no hay platos listos'],
  ]

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <main className={styles.kitchenContent}>
        <section className={styles.kitchenIntro}>
          <h1>Cocina — comandas</h1>
          <p>Actualiza el estado a medida que avanza cada pedido.</p>
          {error && <p>{error}</p>}
        </section>
        <section className={styles.kitchenBoard}>
          {columns.map(([status, title, next, emptyMessage]) => (
            <article className={styles.kitchenColumn} key={status}>
              <div className={styles.kitchenColumnHeading}>
                <h2>{title}</h2>
                <span className={styles.kitchenCount}>
                  {orders.filter((order) => status.split(',').includes(order.status)).length}
                </span>
              </div>
              {orders
                .filter((order) => status.split(',').includes(order.status))
                .map((order) => (
                  <div className={styles.kitchenCard} key={order.id}>
                    <div className={styles.kitchenCardHeader}>
                      <strong>{order.code || `Pedido #${String(order.id).padStart(3, '0')}`}</strong>
                      <small>{order.order_type === 'DELIVERY'
                        ? 'Delivery'
                        : order.order_type === 'TAKEAWAY' ? 'Para llevar' : `Mesa ${order.table_code}`}</small>
                    </div>
                    <small>Hace {elapsed(order.created_at, now)}</small>
                    {order.customer_name && (
                      <span>Cliente: {order.customer_name}</span>
                    )}
                    <div className={styles.kitchenItems}>
                      {(itemsByOrder[order.id] ?? []).map((item) => (
                        <div className={styles.kitchenItem} key={item.product_id}>
                          <strong>{item.quantity}x</strong>
                          <span>{item.product_name}</span>
                          <span>{money(Number(item.unit_price))}</span>
                          {item.notes && <small className={styles.itemNote}>Nota: {item.notes}</small>}
                        </div>
                      ))}
                    </div>
                    {order.delivery_notes && <span>Nota: {order.delivery_notes}</span>}
                    <span className={styles.kitchenTotal}>
                      {money(Number(order.total))}
                    </span>
                    {status !== 'READY' ? (
                      <button onClick={() => void move(order, next)}>
                        {next === 'IN_KITCHEN' ? 'Empezar preparación' : 'Marcar como listo'}
                      </button>
                    ) : (
                      <span className={styles.readyKitchenLabel}>
                        {order.order_type === 'DELIVERY'
                          ? 'Listo para despacho'
                          : order.order_type === 'TAKEAWAY'
                            ? 'Esperando recogida del cliente'
                            : 'Esperando al mesero'}
                      </span>
                    )}
                  </div>
                ))}
              {!orders.some((order) => status.split(',').includes(order.status)) && (
                <p className={styles.emptyColumn}>{emptyMessage}</p>
              )}
            </article>
          ))}
        </section>
      </main>
    </>
  )
}

function elapsed(createdAt: string | undefined, now: number) {
  if (!createdAt) return '—'
  const minutes = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 60_000))
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}