import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EntityCardListProps<T> {
  items: T[]
  getKey: (item: T, index: number) => string
  renderTitle: (item: T, index: number) => ReactNode
  /** Badge or status shown beside the title. */
  renderBadge?: (item: T, index: number) => ReactNode
  renderBody?: (item: T, index: number) => ReactNode
  onAdd?: () => void
  onEdit?: (item: T, index: number) => void
  onDelete?: (item: T, index: number) => void
  /** Extra condition for Add besides `max` (e.g. shares already total 100%). */
  canAdd?: boolean
  /** Hides Delete on records that cannot be removed on their own. */
  canDelete?: (item: T, index: number) => boolean
  addLabel?: string
  editLabel?: string
  /** Add is disabled once this many records exist (2 joint holders, 3 nominees…). */
  max?: number
  emptyText?: string
}

/**
 * Cards for the records a stage collects before one save: joint holders, FATCA records,
 * proof documents, nominees. Content is rendered as React nodes, never as raw HTML.
 */
export function EntityCardList<T>({
  items,
  getKey,
  renderTitle,
  renderBadge,
  renderBody,
  onAdd,
  onEdit,
  onDelete,
  canAdd = true,
  canDelete,
  addLabel = 'Add',
  editLabel = 'Edit',
  max,
  emptyText = 'Nothing added yet.',
}: EntityCardListProps<T>) {
  const atLimit = max !== undefined && items.length >= max

  return (
    <div className="grid gap-4">
      {onAdd && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {max !== undefined ? `${items.length} of ${max} added` : `${items.length} added`}
          </p>
          <Button type="button" onClick={onAdd} disabled={atLimit || !canAdd}>
            <Plus />
            {addLabel}
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <li key={getKey(item, index)}>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="min-w-0 text-base break-words">
                    {renderTitle(item, index)}
                  </CardTitle>
                  {renderBadge?.(item, index)}
                </CardHeader>
                <CardContent className="grid gap-3">
                  {renderBody && (
                    <div className="text-sm text-muted-foreground">{renderBody(item, index)}</div>
                  )}
                  {(onEdit || onDelete) && (
                    <div className="flex gap-2">
                      {onEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(item, index)}
                        >
                          {editLabel === 'Edit' && <Pencil />}
                          {editLabel}
                        </Button>
                      )}
                      {onDelete && (canDelete?.(item, index) ?? true) && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(item, index)}
                        >
                          <Trash2 />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
