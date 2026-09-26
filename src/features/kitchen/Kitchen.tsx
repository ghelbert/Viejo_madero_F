import { useEffect, useState } from 'react'
import styles from '../../App.module.css'
import { api, type Order, type OrderItem, type User } from '../../api'
import { money } from '../../utils/format'
import { Header } from '../../components/Header'

export function Kitchen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [itemsByOrder, setItemsByOrder] = useState<Record<number, OrderItem[]>>({})
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const loadedOrders = await api.orders()
      const details = await Promise.all(
        loadedOrders.map((order) => api.orderDetail(order.id)),
      )
      setOrders(loadedOrders)
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
    void load()
  }, [])

  const move = async (order: Order, status: string) => {
    await api.updateOrder(order.id, status, user.id)
    await load()
  }

  const columns: Array<[string, string, string]> = [
    ['OPEN,CONFIRMED', 'Nuevos', 'IN_KITCHEN'],
    ['IN_KITCHEN', 'En preparación', 'READY'],
    ['READY', 'Listos para entregar', 'READY'],
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
          {columns.map(([status, title, next]) => (
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
                      <strong>#{String(order.id).padStart(3, '0')}</strong>
                      <small>Mesa {order.table_code}</small>
                    </div>
                    {order.customer_name && (
                      <span>Cliente: {order.customer_name}</span>
                    )}
                    <div className={styles.kitchenItems}>
                      {(itemsByOrder[order.id] ?? []).map((item) => (
                        <div className={styles.kitchenItem} key={item.product_id}>
                          <strong>{item.quantity}x</strong>
                          <span>{item.product_name}</span>
                          <span>{money(Number(item.unit_price))}</span>
                        </div>
                      ))}
                    </div>
                    <span className={styles.kitchenTotal}>
                      {money(Number(order.total))}
                    </span>
                    {status !== 'READY' ? (
                      <button onClick={() => void move(order, next)}>
                        {next === 'IN_KITCHEN' ? 'Tomar pedido' : 'Marcar listo'}
                      </button>
                    ) : (
                      <span className={styles.readyKitchenLabel}>
                        Esperando al mesero
                      </span>
                    )}
                  </div>
                ))}
            </article>
          ))}
        </section>
      </main>
    </>
  )
}