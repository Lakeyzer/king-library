export type ReportContentArea = 'works' | 'short_works' | 'adaptations' | 'works_by_others' | 'dark_tower'
export type ReportType = 'issue' | 'missing_content'
export type ReportStatus = 'new' | 'rejected' | 'applied'
export type ReportStatusFilter = ReportStatus | 'all'

export const REPORT_DESCRIPTION_MAX_LENGTH = 500

export interface ReportListEntry {
  id: string
  type: ReportType
  contentArea: ReportContentArea
  description: string
  status: ReportStatus
  createdAt: string
  /** Resolved via `reports_public` from whichever of the four item FKs is set - null for a `missing_content` report, or an `issue` report whose referenced item was since deleted. */
  itemTitle: string | null
  itemSlug: string | null
}

export interface ReportPage {
  reports: ReportListEntry[]
  total: number
}

const REPORT_COLUMNS = 'id, type, content_area, description, status, created_at, item_title, item_slug'

interface ReportPublicRow {
  id: string
  type: ReportType
  content_area: ReportContentArea
  description: string
  status: ReportStatus
  created_at: string
  item_title: string | null
  item_slug: string | null
}

function toReportListEntry(row: ReportPublicRow): ReportListEntry {
  return {
    id: row.id,
    type: row.type,
    contentArea: row.content_area,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    itemTitle: row.item_title,
    itemSlug: row.item_slug
  }
}

function validateDescription(description: string): string {
  const trimmed = description.trim()

  if (!trimmed) throw new Error('Description is required')
  if (trimmed.length > REPORT_DESCRIPTION_MAX_LENGTH) {
    throw new Error(`Description must be ${REPORT_DESCRIPTION_MAX_LENGTH} characters or fewer`)
  }

  return trimmed
}

export function useReports() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Display-only gate for whether to render the admin status control - the
  // `reports status updatable by admin` RLS policy (gated on the same
  // app_metadata.role claim) is what actually enforces this. Same pattern as
  // useSuggestions().isAdmin.
  const isAdmin = computed(() => user.value?.app_metadata?.role === 'admin')

  // 1-indexed page, matching Nuxt UI's UPagination convention - same
  // pagination shape as fetchSuggestions(). `status` defaults to 'all' here;
  // the Reports section on the Suggestion Box page is what defaults its own
  // filter to 'new', mirroring how the Suggestion Box list itself defaults.
  const fetchReports = async (
    { page, pageSize, status = 'all' }: { page: number, pageSize: number, status?: ReportStatusFilter }
  ): Promise<ReportPage> => {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('reports_public')
      .select(REPORT_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return {
      reports: (data as ReportPublicRow[]).map(toReportListEntry),
      total: count ?? 0
    }
  }

  // Base-table write, not through reports_public - that view is read-only
  // usage here. Only `status` is grantable to `authenticated` at the column
  // level (see the add_reports_status_and_public_view migration), so this is
  // the only field this function - or anyone but a database admin - can ever
  // change on a report.
  const updateReportStatus = async (id: string, status: ReportStatus) => {
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', id)

    if (error) throw error
  }

  // Base-table delete, admin-only (see the add_reports_delete_policy
  // migration) - permanent, no soft-delete. Nothing references reports.id
  // via foreign key, so there's nothing else to clean up.
  const deleteReport = async (id: string) => {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const reportIssue = async (
    { contentArea, itemId, description }: { contentArea: ReportContentArea, itemId: string, description: string }
  ) => {
    if (!user.value) throw new Error('Not signed in')

    const validDescription = validateDescription(description)

    // One insert per content area rather than a computed FK-column key -
    // see add-content-reporting's design.md "One `reports` table, four
    // nullable item-reference columns". A computed key here would widen the
    // insert payload to a `{ [x: string]: string }` index signature, which
    // Supabase's generated insert types reject.
    const baseRow = { user_id: user.value.sub, type: 'issue' as const, content_area: contentArea, description: validDescription }

    let error
    switch (contentArea) {
      case 'works':
        ({ error } = await supabase.from('reports').insert({ ...baseRow, king_work_id: itemId }))
        break
      case 'short_works':
        ({ error } = await supabase.from('reports').insert({ ...baseRow, short_story_id: itemId }))
        break
      case 'adaptations':
        ({ error } = await supabase.from('reports').insert({ ...baseRow, adaptation_id: itemId }))
        break
      case 'works_by_others':
        ({ error } = await supabase.from('reports').insert({ ...baseRow, related_work_id: itemId }))
        break
      // Missing-content only - the Dark Tower lists span king_works and
      // king_short_stories, so there's no single item FK to report against
      // (also enforced by reports_dark_tower_missing_content_only).
      case 'dark_tower':
        throw new Error('Dark Tower reports are missing-content only')
    }

    if (error) throw error
  }

  const reportMissingContent = async (
    { contentArea, description }: { contentArea: ReportContentArea, description: string }
  ) => {
    if (!user.value) throw new Error('Not signed in')

    const validDescription = validateDescription(description)

    const { error } = await supabase.from('reports').insert({
      user_id: user.value.sub,
      type: 'missing_content',
      content_area: contentArea,
      description: validDescription
    })

    if (error) throw error
  }

  return { isAdmin, fetchReports, updateReportStatus, deleteReport, reportIssue, reportMissingContent }
}
