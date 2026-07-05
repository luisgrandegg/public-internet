'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { Input, Button, Textarea, Stack, Badge } from '@public-internet/design-system'
import { MenuItemCard } from '@/components/MenuItemCard'
import {
  createMenuItemAction,
  deleteMenuItemAction,
  toggleMenuItemAvailability,
  updateMenuItemAction,
  type MenuActionResult,
} from '@/lib/actions/menu'
import { formatEuros } from '@/lib/format'
import styles from './page.module.css'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
}

interface Props {
  restaurantId: string
  items: MenuItem[]
}

export function MenuManagement({ restaurantId, items }: Props) {
  const boundCreate = createMenuItemAction.bind(null, restaurantId)
  const [createState, createAction, isCreating] = useActionState<
    MenuActionResult | null,
    FormData
  >(boundCreate, null)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className={styles.layout}>
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Add a menu item</h2>
        <form action={createAction} className={styles.form}>
          {createState && !createState.ok && createState.globalError && (
            <div role="alert" className={styles.globalError}>
              {createState.globalError}
            </div>
          )}
          <Stack gap={4}>
            <Input
              name="name"
              label="Name"
              required
              error={createState && !createState.ok ? createState.fieldErrors.name : undefined}
            />
            <Textarea
              name="description"
              label="Description"
              required
              rows={3}
              error={
                createState && !createState.ok ? createState.fieldErrors.description : undefined
              }
            />
            <Input
              name="price"
              label="Price (€)"
              type="number"
              step="0.01"
              min="0.01"
              required
              error={createState && !createState.ok ? createState.fieldErrors.price : undefined}
            />
            <Input
              name="category"
              label="Category (e.g. Starters, Mains, Desserts)"
              required
              error={
                createState && !createState.ok ? createState.fieldErrors.category : undefined
              }
            />
          </Stack>
          <Button type="submit" variant="primary" disabled={isCreating}>
            {isCreating ? 'Adding…' : 'Add item'}
          </Button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Current menu</h2>
        {items.length === 0 ? (
          <p className={styles.empty}>
            No items yet. Use the form above to add your first dish.
          </p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id}>
                <MenuItemCard
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  category={item.category}
                  isAvailable={item.isAvailable}
                  footer={
                    <MenuItemControls
                      restaurantId={restaurantId}
                      itemId={item.id}
                      itemName={item.name}
                      isAvailable={item.isAvailable}
                      isEditing={editingId === item.id}
                      onToggleEdit={() =>
                        setEditingId((current) => (current === item.id ? null : item.id))
                      }
                    />
                  }
                />
                {editingId === item.id && (
                  <EditMenuItemForm
                    restaurantId={restaurantId}
                    item={item}
                    onDone={() => setEditingId(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function MenuItemControls({
  restaurantId,
  itemId,
  itemName,
  isAvailable,
  isEditing,
  onToggleEdit,
}: {
  restaurantId: string
  itemId: string
  itemName: string
  isAvailable: boolean
  isEditing: boolean
  onToggleEdit: () => void
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className={styles.controls}>
      {isAvailable ? (
        <Badge variant="success">Available</Badge>
      ) : (
        <Badge variant="warning">Hidden</Badge>
      )}
      <Button
        variant="secondary"
        type="button"
        disabled={isPending}
        aria-expanded={isEditing}
        aria-label={isEditing ? `Close editor for ${itemName}` : `Edit ${itemName}`}
        onClick={onToggleEdit}
      >
        {isEditing ? 'Close editor' : 'Edit'}
      </Button>
      <Button
        variant="secondary"
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            toggleMenuItemAvailability(restaurantId, itemId, !isAvailable),
          )
        }
      >
        {isAvailable ? 'Hide from customers' : 'Make available'}
      </Button>
      <Button
        variant="destructive"
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!confirm('Remove this item from your menu?')) return
          startTransition(() => deleteMenuItemAction(restaurantId, itemId))
        }}
      >
        Remove
      </Button>
    </div>
  )
}

function EditMenuItemForm({
  restaurantId,
  item,
  onDone,
}: {
  restaurantId: string
  item: MenuItem
  onDone: () => void
}) {
  const boundUpdate = updateMenuItemAction.bind(null, restaurantId, item.id)
  const [state, formAction, isPending] = useActionState<MenuActionResult | null, FormData>(
    boundUpdate,
    null,
  )

  useEffect(() => {
    if (state?.ok) onDone()
  }, [state, onDone])

  const fieldError = (key: string) =>
    state && !state.ok ? state.fieldErrors[key] : undefined

  return (
    <form action={formAction} className={styles.editForm} aria-label={`Edit ${item.name}`}>
      {state && !state.ok && state.globalError && (
        <div role="alert" className={styles.globalError}>
          {state.globalError}
        </div>
      )}
      <Stack gap={4}>
        <Input
          name="name"
          label="Name"
          defaultValue={item.name}
          required
          error={fieldError('name')}
        />
        <Textarea
          name="description"
          label="Description"
          defaultValue={item.description}
          required
          rows={3}
          error={fieldError('description')}
        />
        <Input
          name="price"
          label="Price (€)"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={(item.price / 100).toFixed(2)}
          required
          error={fieldError('price')}
        />
        <Input
          name="category"
          label="Category (e.g. Starters, Mains, Desserts)"
          defaultValue={item.category}
          required
          error={fieldError('category')}
        />
      </Stack>
      <div className={styles.controls}>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// Re-export formatEuros so callers see the shared formatting is in use.
export { formatEuros }
