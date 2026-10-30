# hrhub theme tokens

## Dark mode — locked primary (do not change)

| Token | Value | Purpose |
|-------|--------|---------|
| `--primary` | **`#2a3746`** | Buttons, badges, surfaces (locked) |
| `--primary-foreground` | `#d8dce2` | Text on primary surfaces |
| `--sidebar-primary` | **`#2a3746`** | Sidebar active/highlight (same as primary) |

**Do not change dark `--primary` to green or another color.** Table readability is fixed with `text-foreground` and `text-erp-accent`, not by changing primary.

## Accent (links, hover on dark tables)

| Token | Light | Dark |
|-------|-------|------|
| `--erp-accent` | `hsl(142.1 76.2% 36.3%)` | same |
| `--erp-accent-foreground` | `#ffffff` | `#ffffff` |

Tailwind: `text-erp-accent`, `hover:text-erp-accent`, `bg-erp-accent`, etc.

## Readable table text (dark mode)

- Default cell color: `var(--foreground)` (`#d8dce2`) via `globals.css` and `DataTable` `text-foreground`.
- ID / employee name links: `text-foreground hover:text-erp-accent`.

Defined in `app/globals.css` (see comment block above `.dark` `--primary`).
