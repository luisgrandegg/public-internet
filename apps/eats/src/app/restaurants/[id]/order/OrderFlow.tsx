'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Textarea, Stack, Divider } from '@public-internet/design-system'
import { MenuItemCard } from '@/components/MenuItemCard'
import { formatEuros } from '@/lib/format'
import { placeOrderAction } from '@/lib/actions/orders'
import styles from './page.module.css'

interface OrderMenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
}

interface Props {
  restaurantId: string
  restaurantName: string
  infrastructureFee: number
  items: OrderMenuItem[]
}

type Step = 'cart' | 'summary'

export function OrderFlow({ restaurantId, restaurantName, infrastructureFee, items }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('cart')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [addressError, setAddressError] = useState<string | null>(null)

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  const chosenLines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => {
          const item = itemsById.get(id)!
          return { item, quantity: q, subtotal: item.price * q }
        }),
    [cart, itemsById],
  )

  const itemsCost = chosenLines.reduce((sum, l) => sum + l.subtotal, 0)
  const totalCost = itemsCost + infrastructureFee
  const hasItems = chosenLines.length > 0

  const increment = (id: string) =>
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
  const decrement = (id: string) =>
    setCart((c) => {
      const next = Math.max(0, (c[id] ?? 0) - 1)
      return { ...c, [id]: next }
    })

  function handleProceed() {
    if (!hasItems) return
    if (deliveryAddress.trim().length < 5) {
      setAddressError('Please enter a delivery address')
      return
    }
    setAddressError(null)
    setStep('summary')
  }

  function handleConfirm() {
    setGlobalError(null)
    startTransition(async () => {
      const result = await placeOrderAction({
        restaurantId,
        items: chosenLines.map(({ item, quantity }) => ({
          menuItemId: item.id,
          quantity,
        })),
        deliveryAddress,
        notes: notes.trim() || undefined,
      })
      if (!result.ok) {
        setGlobalError(result.globalError ?? 'Could not place order.')
        return
      }
      if (result.checkoutUrl) {
        // Online-payment node (ADR-006): hand off to the provider's hosted
        // checkout page. The amount charged there is exactly the total shown above.
        window.location.assign(result.checkoutUrl)
        return
      }
      router.push(`/orders/${result.orderId}`)
    })
  }

  if (step === 'summary') {
    return (
      <section className={styles.summary} aria-labelledby="summary-heading">
        <h2 id="summary-heading" className={styles.sectionHeading}>
          Review your order
        </h2>
        {globalError && (
          <div role="alert" className={styles.globalError}>
            {globalError}
          </div>
        )}

        <ul className={styles.summaryList}>
          {chosenLines.map(({ item, quantity, subtotal }) => (
            <li key={item.id} className={styles.summaryRow}>
              <span>
                {quantity} × {item.name}
              </span>
              <span>{formatEuros(subtotal)}</span>
            </li>
          ))}
        </ul>

        <Divider />

        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Items</span>
            <span>{formatEuros(itemsCost)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Platform infrastructure fee</span>
            <span>{formatEuros(infrastructureFee)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Total</span>
            <span>{formatEuros(totalCost)}</span>
          </div>
        </div>

        <p className={styles.transparencyNote}>
          This total is complete. There are no service charges, no surge pricing, and no
          hidden fees added after you confirm.
        </p>

        <div className={styles.summaryMeta}>
          <p>
            <strong>Delivery to:</strong> {deliveryAddress}
          </p>
          {notes && (
            <p>
              <strong>Notes:</strong> {notes}
            </p>
          )}
        </div>

        <div className={styles.summaryActions}>
          <Button variant="secondary" onClick={() => setStep('cart')} disabled={isPending}>
            Back to cart
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Placing order…' : `Confirm and pay ${formatEuros(totalCost)}`}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <div className={styles.cartLayout}>
      <section aria-labelledby="menu-heading" className={styles.menuPane}>
        <h2 id="menu-heading" className={styles.sectionHeading}>
          Menu
        </h2>
        {items.length === 0 ? (
          <p className={styles.empty}>
            {restaurantName} has no available items right now.
          </p>
        ) : (
          <ul className={styles.menuList}>
            {items.map((item) => {
              const qty = cart[item.id] ?? 0
              return (
                <li key={item.id}>
                  <MenuItemCard
                    name={item.name}
                    description={item.description}
                    price={item.price}
                    category={item.category}
                    footer={
                      <div className={styles.qtyControls}>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => decrement(item.id)}
                          disabled={qty === 0}
                          aria-label={`Remove one ${item.name}`}
                        >
                          −
                        </Button>
                        <span
                          className={styles.qtyValue}
                          aria-live="polite"
                          aria-label={`${qty} in cart`}
                        >
                          {qty}
                        </span>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => increment(item.id)}
                          aria-label={`Add one ${item.name}`}
                        >
                          +
                        </Button>
                      </div>
                    }
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <aside aria-label="Order summary" className={styles.cartPane}>
        <h2 className={styles.sectionHeading}>Your cart</h2>
        {!hasItems ? (
          <p className={styles.empty}>No items yet — add something from the menu.</p>
        ) : (
          <>
            <ul className={styles.cartList}>
              {chosenLines.map(({ item, quantity, subtotal }) => (
                <li key={item.id} className={styles.cartRow}>
                  <span>
                    {quantity} × {item.name}
                  </span>
                  <span>{formatEuros(subtotal)}</span>
                </li>
              ))}
            </ul>
            <Divider />
            <div className={styles.cartTotals}>
              <div className={styles.totalRow}>
                <span>Items</span>
                <span>{formatEuros(itemsCost)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Platform infrastructure fee</span>
                <span>{formatEuros(infrastructureFee)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total before confirm</span>
                <span>{formatEuros(totalCost)}</span>
              </div>
            </div>
          </>
        )}

        <Stack gap={3} className={styles.addressBlock}>
          <Input
            label="Delivery address"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            required
            error={addressError ?? undefined}
          />
          <Textarea
            label="Notes for the kitchen (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </Stack>

        <Button
          type="button"
          variant="primary"
          onClick={handleProceed}
          disabled={!hasItems}
        >
          Review order
        </Button>
      </aside>
    </div>
  )
}
