import { useEffect, useMemo, useState } from 'react'
import { api, subscribeToOrderUpdates, type Order, type Product, type User } from '../../api'
import { Header } from '../../components/Header'
import { LocationMap } from '../../components/LocationMap'
import { money } from '../../utils/format'
import styles from './Reception.module.css'

type OrderType = 'DELIVERY' | 'TAKEAWAY'
type PaymentMethod = 'YAPE' | 'PLIN' | 'CASH'

const paymentLabels: Record<PaymentMethod, string> = {
  YAPE: 'Yape',
  PLIN: 'Plin',
  CASH: 'Efectivo',
}

export function Reception({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [step, setStep] = useState(1)
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [notes, setNotes] = useState('')
  const [cart, setCart] = useState<Record<number, number>>({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [loadedOrders, loadedProducts] = await Promise.all([
      api.deliveryOrders(),
      api.products(),
    ])
    setOrders(loadedOrders)
    setProducts(loadedProducts)
  }

  useEffect(() => {
    void Promise.resolve().then(load).catch((loadError) => setError(loadError.message))
    const unsubscribe = subscribeToOrderUpdates(() => {
      void api.deliveryOrders().then(setOrders).catch((loadError) => setError(loadError.message))
    })
    const refresh = () => {
      void api.deliveryOrders().then(setOrders).catch((loadError) => setError(loadError.message))
    }
    window.addEventListener('focus', refresh)
    return () => {
      unsubscribe()
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const selectedProducts = useMemo(
    () => products.filter((product) => cart[product.id]),
    [products, cart],
  )
  const total = selectedProducts.reduce(
    (sum, product) => sum + Number(product.base_price) * cart[product.id],
    0,
  )
  const groupedProducts = products.reduce<Record<string, Product[]>>((groups, product) => {
    const category = product.category || 'Otros'
    groups[category] = [...(groups[category] ?? []), product]
    return groups
  }, {})
  const parsedLatitude = latitude.trim() ? Number(latitude) : null
  const parsedLongitude = longitude.trim() ? Number(longitude) : null
  const hasValidCoordinates = coordinatesAreValid(parsedLatitude, parsedLongitude)

  const startRegistration = () => {
    setError('')
    setMessage('')
    setIsCreating(true)
    setStep(1)
  }

  const closeRegistration = () => {
    setIsCreating(false)
    setStep(1)
    setOrderType('DELIVERY')
    setCustomerName('')
    setCustomerPhone('')
    setAddress('')
    setLatitude('')
    setLongitude('')
    setShowMap(false)
    setCart({})
    setError('')
    setPaymentMethod('')
    setNotes('')
  }

  const changeQuantity = (id: number, amount: number) => {
    setCart((current) => {
      const next = { ...current }
      const quantity = (next[id] ?? 0) + amount
      if (quantity <= 0) delete next[id]
      else next[id] = quantity
      return next
    })
  }

  const next = () => {
    setError('')
    if (step === 1) {
      if (!customerName.trim() || !customerPhone.trim()) {
        setError('Ingresa el nombre y el teléfono del cliente.')
        return
      }
      if (orderType === 'DELIVERY') {
        if (!address.trim()) {
          setError('La dirección de entrega es obligatoria.')
          return
        }
        const lat = Number(latitude)
        const lon = Number(longitude)
        if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lon)
          || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          setError('Registra coordenadas válidas para la ubicación de entrega.')
          return
        }
      }
    }
    if (step === 2 && selectedProducts.length === 0) {
      setError('Agrega al menos un plato al pedido.')
      return
    }
    if (step === 3 && !paymentMethod) {
      setError('Selecciona un método de pago.')
      return
    }
    setStep((current) => current + 1)
  }

  const submit = async () => {
    if (!paymentMethod) return
    setSaving(true)
    setError('')
    try {
      const created = await api.createDeliveryOrder({
        orderType,
        createdBy: user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        ...(orderType === 'DELIVERY'
          ? {
              deliveryAddress: address.trim(),
              deliveryLatitude: Number(latitude),
              deliveryLongitude: Number(longitude),
            }
          : {}),
        paymentMethod,
        notes: notes.trim(),
        items: selectedProducts.map((product) => ({
          productId: product.id,
          productName: product.name,
          price: Number(product.base_price),
          quantity: cart[product.id],
          notes: '',
        })),
      })
      setMessage(`Pedido ${created.code} enviado a cocina.`)
      closeRegistration()
      try {
        await load()
      } catch (loadError) {
        const detail = loadError instanceof Error ? loadError.message : String(loadError)
        setError(`El pedido ${created.code} se registró, pero no se pudo actualizar la lista: ${detail}`)
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo registrar el pedido.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <main className={styles.receptionContent}>
        <header className={styles.pageHeading}>
          <div>
            <h1>Pedidos de recepción</h1>
            <p>Registra pedidos para delivery o para llevar y consulta su avance.</p>
          </div>
          {!isCreating && <button onClick={startRegistration}>Registrar un pedido</button>}
        </header>
        {message && <p className={styles.success} role="status">{message}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}

        {isCreating ? (
          <section className={styles.formPanel}>
            <div className={styles.formHeading}>
              <div>
                <span>Paso {step} de 4</span>
                <h2>{step === 1 ? 'Datos del cliente' : step === 2 ? 'Carta de platos' : step === 3 ? 'Pago y nota' : 'Resumen del pedido'}</h2>
              </div>
              <button className={styles.secondaryButton} onClick={closeRegistration}>Cancelar</button>
            </div>

            {step === 1 && (
              <div className={styles.customerForm}>
                <fieldset className={styles.typeOptions}>
                  <legend>Tipo de pedido</legend>
                  <label>
                    <input type="radio" name="orderType" checked={orderType === 'DELIVERY'} onChange={() => setOrderType('DELIVERY')} />
                    Delivery
                  </label>
                  <label>
                    <input type="radio" name="orderType" checked={orderType === 'TAKEAWAY'} onChange={() => setOrderType('TAKEAWAY')} />
                    Para llevar
                  </label>
                </fieldset>
                <label>Nombre del cliente<input value={customerName} maxLength={120} onChange={(event) => setCustomerName(event.target.value)} required /></label>
                <label>Teléfono<input type="tel" value={customerPhone} maxLength={30} onChange={(event) => setCustomerPhone(event.target.value)} required /></label>
                {orderType === 'DELIVERY' && (
                  <>
                    <label className={styles.fullWidth}>Dirección de entrega<input value={address} maxLength={500} onChange={(event) => setAddress(event.target.value)} required /></label>
                    <label>Latitud<input type="number" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} required /></label>
                    <label>Longitud<input type="number" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} required /></label>
                    {!showMap && (
                      <div className={`${styles.mapHint} ${styles.fullWidth}`}>
                        <p>El mapa interactivo carga OpenStreetMap y comparte tu ubicación de búsqueda solo cuando lo solicitas.</p>
                        <button type="button" className={styles.secondaryButton} onClick={() => setShowMap(true)}>Elegir pin en el mapa</button>
                      </div>
                    )}
                    {showMap && (
                      <div className={`${styles.mapSelector} ${styles.fullWidth}`}>
                        <LocationMap
                          latitude={hasValidCoordinates ? parsedLatitude : null}
                          longitude={hasValidCoordinates ? parsedLongitude : null}
                          interactive
                          label="Selecciona la ubicación de entrega"
                          onChange={(lat, lon) => {
                            setLatitude(lat.toFixed(6))
                            setLongitude(lon.toFixed(6))
                          }}
                        />
                        <p>Haz clic en el destino o arrastra el pin. Coordenadas: {hasValidCoordinates ? `${parsedLatitude?.toFixed(6)}, ${parsedLongitude?.toFixed(6)}` : 'selecciona una ubicación'}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className={styles.menuAndCart}>
                <div className={styles.menu}>
                  {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                    <section key={category}>
                      <h3>{category}</h3>
                      {categoryProducts.map((product) => (
                        <article className={styles.productRow} key={product.id}>
                          <div><strong>{product.name}</strong><small>{product.description}</small></div>
                          <b>{money(Number(product.base_price))}</b>
                          <button aria-label={`Agregar ${product.name}`} onClick={() => changeQuantity(product.id, 1)}>+</button>
                        </article>
                      ))}
                    </section>
                  ))}
                </div>
                <aside className={styles.cart}>
                  <h3>Pedido</h3>
                  {selectedProducts.map((product) => (
                    <div className={styles.cartRow} key={product.id}>
                      <span>{product.name}</span>
                      <div>
                        <button aria-label={`Quitar uno de ${product.name}`} onClick={() => changeQuantity(product.id, -1)}>−</button>
                        <b>{cart[product.id]}</b>
                        <button aria-label={`Agregar uno de ${product.name}`} onClick={() => changeQuantity(product.id, 1)}>+</button>
                        <button aria-label={`Eliminar ${product.name}`} onClick={() => setCart((current) => {
                          const nextCart = { ...current }
                          delete nextCart[product.id]
                          return nextCart
                        })}>×</button>
                      </div>
                      <strong>{money(Number(product.base_price) * cart[product.id])}</strong>
                    </div>
                  ))}
                  {!selectedProducts.length && <p>No hay platos seleccionados.</p>}
                  <div className={styles.total}><span>Total</span><strong>{money(total)}</strong></div>
                </aside>
              </div>
            )}

            {step === 3 && (
              <div className={styles.paymentForm}>
                <fieldset className={styles.typeOptions}>
                  <legend>Método de pago</legend>
                  {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
                    <label key={method}>
                      <input type="radio" name="paymentMethod" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                      {paymentLabels[method]}
                    </label>
                  ))}
                </fieldset>
                <label>Nota adicional (opcional)<textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} rows={4} /></label>
              </div>
            )}

            {step === 4 && (
              <div className={styles.summary}>
                <section>
                  <h3>Cliente y destino</h3>
                  <p>{customerName} · {customerPhone}</p>
                  <p>{orderType === 'DELIVERY' ? address : 'Pedido para llevar'}</p>
                  {orderType === 'DELIVERY' && <p>Ubicación: {latitude}, {longitude}</p>}
                </section>
                <section>
                  <h3>Detalle del pedido</h3>
                  {selectedProducts.map((product) => (
                    <p key={product.id}>{cart[product.id]} × {product.name} — {money(Number(product.base_price) * cart[product.id])}</p>
                  ))}
                  <p><strong>Método de pago: {paymentMethod ? paymentLabels[paymentMethod] : ''}</strong></p>
                  {notes && <p>Nota: {notes}</p>}
                  <div className={styles.total}><span>Total</span><strong>{money(total)}</strong></div>
                </section>
                <button className={styles.secondaryButton} onClick={() => setStep(1)}>Editar datos del cliente</button>
                <button className={styles.secondaryButton} onClick={() => setStep(2)}>Editar pedido</button>
                <button className={styles.secondaryButton} onClick={() => setStep(3)}>Editar pago</button>
              </div>
            )}

            {error && <p className={styles.error} role="alert">{error}</p>}
            <footer className={styles.formActions}>
              {step > 1 && <button className={styles.secondaryButton} onClick={() => { setError(''); setStep((current) => current - 1) }}>Atrás</button>}
              {step < 4
                ? <button onClick={next}>Siguiente</button>
                : <button onClick={() => void submit()} disabled={saving}>{saving ? 'Enviando...' : 'Enviar a cocina'}</button>}
            </footer>
          </section>
        ) : (
          <section className={styles.ordersPanel}>
            <div className={styles.listHeading}>
              <h2>Pedidos registrados</h2>
              <button className={styles.secondaryButton} onClick={() => void load().catch((loadError) => setError(loadError.message))}>Actualizar</button>
            </div>
            {orders.length === 0 ? <p className={styles.empty}>No hay pedidos de recepción registrados.</p> : (
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>Código</th><th>Tipo</th><th>Estado</th><th>Cliente</th><th>Dirección</th><th>Ítems</th><th>Pago</th><th>Total</th></tr></thead>
                  <tbody>{orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.code}</td>
                      <td>{order.order_type === 'DELIVERY' ? 'Delivery' : 'Para llevar'}</td>
                      <td>{statusLabel(order.status)}</td>
                      <td>{order.customer_name}<small>{order.customer_phone}</small></td>
                      <td>{order.delivery_address || 'Retiro en local'}</td>
                      <td>{order.item_count ?? 0}</td>
                      <td>{order.payment_method ? paymentLabels[order.payment_method] : '—'}</td>
                      <td>{money(Number(order.total))}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  )
}

function coordinatesAreValid(latitude: number | null, longitude: number | null) {
  return latitude !== null
    && longitude !== null
    && Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    OPEN: 'Nuevo',
    CONFIRMED: 'Nuevo',
    IN_KITCHEN: 'En preparación',
    READY: 'Listo para despacho',
    IN_ROUTE: 'En camino',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  }
  return labels[status] ?? status
}
