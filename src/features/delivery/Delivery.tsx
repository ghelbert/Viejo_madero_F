import { useEffect, useState } from 'react'
import { api, subscribeToOrderUpdates, type Order, type OrderDetail, type User } from '../../api'
import { Header } from '../../components/Header'
import { LocationMap } from '../../components/LocationMap'
import { money } from '../../utils/format'
import styles from './Delivery.module.css'

type View = 'dispatch' | 'history'

const paymentLabel: Record<string, string> = {
  YAPE: 'Yape',
  PLIN: 'Plin',
  CASH: 'Efectivo',
}

export function Delivery({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [history, setHistory] = useState<Order[]>([])
  const [view, setView] = useState<View>('dispatch')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [details, setDetails] = useState<Record<number, OrderDetail>>({})
  const [mapVisibleId, setMapVisibleId] = useState<number | null>(null)
  const [confirming, setConfirming] = useState<Order | null>(null)
  const [completionNote, setCompletionNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [active, delivered] = await Promise.all([
      api.deliveryDispatch(),
      api.deliveryHistory(),
    ])
    setOrders(active)
    setHistory(delivered)
  }

  useEffect(() => {
    void Promise.resolve().then(load).catch((loadError) => setError(loadError.message))
    const refresh = () => {
      void load().catch((loadError) => setError(loadError.message))
    }
    const unsubscribe = subscribeToOrderUpdates(refresh)
    window.addEventListener('focus', refresh)
    return () => {
      unsubscribe()
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const openDetails = async (order: Order) => {
    setError('')
    if (expandedId === order.id) {
      setExpandedId(null)
      return
    }
    try {
      const detail = await api.orderDetail(order.id)
      setDetails((current) => ({ ...current, [order.id]: detail }))
      setExpandedId(order.id)
    } catch (detailError) {
      setError(detailError instanceof Error
        ? detailError.message
        : 'No fue posible recuperar la información del pedido')
    }
  }

  const startRoute = async (order: Order) => {
    setSaving(true)
    setError('')
    try {
      await api.startDeliveryRoute(order.id, user.id)
      try {
        await load()
      } catch (loadError) {
        const detail = loadError instanceof Error ? loadError.message : String(loadError)
        setError(`La ruta se inició, pero no se pudo actualizar la lista: ${detail}`)
      }
    } catch (routeError) {
      setError(routeError instanceof Error
        ? routeError.message
        : 'El pedido no se encuentra disponible para iniciar ruta')
    } finally {
      setSaving(false)
    }
  }

  const finishDelivery = async () => {
    if (!confirming) return
    setSaving(true)
    setError('')
    try {
      await api.completeDelivery(confirming.id, user.id, completionNote.trim())
      setConfirming(null)
      setCompletionNote('')
      setExpandedId(null)
      try {
        await load()
      } catch (loadError) {
        const detail = loadError instanceof Error ? loadError.message : String(loadError)
        setError(`La entrega se confirmó, pero no se pudo actualizar la lista: ${detail}`)
      }
    } catch (deliveryError) {
      setError(deliveryError instanceof Error
        ? deliveryError.message
        : 'No se pudo confirmar la entrega')
    } finally {
      setSaving(false)
    }
  }

  const visibleOrders = view === 'dispatch' ? orders : history
  const pendingCount = orders.filter((order) => order.status === 'READY').length
  const routeCount = orders.filter((order) => order.status === 'IN_ROUTE').length

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <main className={styles.deliveryContent}>
        <header className={styles.deliveryHeading}>
          <div>
            <h1>Despacho y rutas</h1>
            <p>Consulta los pedidos listos y gestiona tus entregas.</p>
          </div>
          <button className={styles.refresh} onClick={() => void load().catch((loadError) => setError(loadError.message))}>Actualizar</button>
        </header>
        <section className={styles.counters}>
          <article><span>Pendientes</span><strong>{pendingCount}</strong></article>
          <article><span>En ruta</span><strong>{routeCount}</strong></article>
        </section>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <nav className={styles.tabs} aria-label="Pedidos de entrega">
          <button className={view === 'dispatch' ? styles.activeTab : ''} onClick={() => setView('dispatch')}>Despacho activo</button>
          <button className={view === 'history' ? styles.activeTab : ''} onClick={() => setView('history')}>Historial</button>
        </nav>
        {visibleOrders.length === 0 ? (
          <p className={styles.empty}>{view === 'dispatch' ? 'No existen pedidos disponibles para despacho.' : 'Aún no hay entregas en el historial.'}</p>
        ) : (
          <section className={styles.orderList}>
            {visibleOrders.map((order) => {
              const detail = details[order.id]
              const hasCoordinates = detail?.delivery_latitude != null
                && detail.delivery_longitude != null
                && Number.isFinite(Number(detail.delivery_latitude))
                && Number.isFinite(Number(detail.delivery_longitude))
              return (
                <article className={styles.orderCard} key={order.id}>
                  <header className={styles.cardHeading}>
                    <div><strong>{order.code}</strong><span>{statusLabel(order.status)}</span></div>
                    <strong>{money(Number(order.total))}</strong>
                  </header>
                  <div className={styles.cardSummary}>
                    <span>{order.customer_name || 'Cliente sin nombre'}</span>
                    <span>{order.delivery_address || 'Retiro en local'}</span>
                    <span>{order.item_count ?? 0} ítems</span>
                    {order.ready_at && <span>Salió de cocina {formatDate(order.ready_at)}</span>}
                    {order.route_started_at && <span>En ruta desde {formatDate(order.route_started_at)}</span>}
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.secondaryButton} onClick={() => void openDetails(order)}>
                      {expandedId === order.id ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                    {view === 'dispatch' && order.status === 'READY' && (
                      <button disabled={saving} onClick={() => void startRoute(order)}>
                        {saving ? 'Procesando...' : 'Aceptar e iniciar ruta'}
                      </button>
                    )}
                    {view === 'dispatch' && order.status === 'IN_ROUTE' && order.delivery_user_id === user.id && (
                      <button onClick={() => { setConfirming(order); setCompletionNote('') }}>Confirmar entrega</button>
                    )}
                    {view === 'dispatch' && order.status === 'IN_ROUTE' && order.delivery_user_id !== user.id && (
                      <span className={styles.assignment}>Asignado a repartidor #{order.delivery_user_id}</span>
                    )}
                  </div>
                  {expandedId === order.id && detail && (
                    <div className={styles.detail}>
                      <section>
                        <h2>Cliente y destino</h2>
                        <p>{detail.customer_name || 'Nombre no registrado'}</p>
                        <p>{detail.customer_phone || 'Teléfono no registrado'}</p>
                        <p>{detail.delivery_address || 'Dirección no registrada'}</p>
                      </section>
                      <section>
                        <h2>Cobro contra entrega</h2>
                        <p>Método de pago: {detail.payment_method ? paymentLabel[detail.payment_method] : 'No especificado'}</p>
                        <strong>{money(Number(detail.total))}</strong>
                      </section>
                      <section>
                        <h2>Detalle de productos</h2>
                        {detail.items.map((item, index) => (
                          <div className={styles.item} key={`${item.product_id}-${index}`}>
                            <span>{item.quantity} × {item.product_name}</span>
                            <strong>{money(Number(item.line_total))}</strong>
                            {item.notes && <small>Nota: {item.notes}</small>}
                          </div>
                        ))}
                      </section>
                      {detail.delivery_notes && <section><h2>Nota del pedido</h2><p>{detail.delivery_notes}</p></section>}
                      <section className={styles.location}>
                        <h2>Ubicación de entrega</h2>
                        {hasCoordinates
                          ? mapVisibleId === order.id
                            ? <LocationMap
                                latitude={Number(detail.delivery_latitude)}
                                longitude={Number(detail.delivery_longitude)}
                                label={`Ubicación de entrega ${order.code}`}
                              />
                            : <div className={styles.mapPrompt}>
                                <p>El mapa externo solo carga cuando lo solicitas; compartirá estas coordenadas con OpenStreetMap.</p>
                                <button className={styles.secondaryButton} onClick={() => setMapVisibleId(order.id)}>Mostrar ubicación en el mapa</button>
                              </div>
                          : <p>No hay coordenadas registradas para mostrar la ubicación</p>}
                      </section>
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        )}
      </main>

      {confirming && (
        <div className={styles.modalBackdrop} onClick={() => setConfirming(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="complete-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="complete-title">Cierre de ruta</h2>
            <p><strong>{confirming.code}</strong></p>
            <p>{confirming.customer_name}</p>
            <p>{confirming.delivery_address}</p>
            <strong>{money(Number(confirming.total))}</strong>
            <label>Nota de entrega (opcional)<textarea value={completionNote} maxLength={2000} rows={3} onChange={(event) => setCompletionNote(event.target.value)} /></label>
            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} disabled={saving} onClick={() => setConfirming(null)}>Cancelar</button>
              <button disabled={saving} onClick={() => void finishDelivery()}>{saving ? 'Guardando...' : 'Confirmar y finalizar'}</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function statusLabel(status: string) {
  if (status === 'READY') return 'Listo para despacho'
  if (status === 'IN_ROUTE') return 'En camino'
  if (status === 'DELIVERED') return 'Entregado'
  return status
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
