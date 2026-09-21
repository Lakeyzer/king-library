export type SuggestionStatus = 'new' | 'rejected' | 'confirmed' | 'applied'

export type SuggestionStatusFilter = SuggestionStatus | 'all'

export type SuggestionSort = 'newest' | 'popular'

export const SUGGESTION_TITLE_MAX_LENGTH = 100
export const SUGGESTION_BODY_MAX_LENGTH = 1000

export interface SuggestionListEntry {
  id: string
  title: string
  body: string
  isAnonymous: boolean
  status: SuggestionStatus
  createdAt: string
  username: string | null
  upvoteCount: number
  downvoteCount: number
  score: number
  // null = hasn't voted, true = upvoted, false = downvoted.
  myVote: boolean | null
}

export interface SuggestionPage {
  suggestions: SuggestionListEntry[]
  total: number
}

const SUGGESTION_COLUMNS = 'id, title, body, is_anonymous, status, created_at, username, upvote_count, downvote_count, score, my_vote'

interface SuggestionWithAuthorRow {
  id: string
  title: string
  body: string
  is_anonymous: boolean
  status: SuggestionStatus
  created_at: string
  username: string | null
  upvote_count: number
  downvote_count: number
  score: number
  my_vote: boolean | null
}

function toSuggestionListEntry(row: SuggestionWithAuthorRow): SuggestionListEntry {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    isAnonymous: row.is_anonymous,
    status: row.status,
    createdAt: row.created_at,
    username: row.username,
    upvoteCount: row.upvote_count,
    downvoteCount: row.downvote_count,
    score: row.score,
    myVote: row.my_vote
  }
}

export function useSuggestions() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Display-only gate for whether to render the admin status control -
  // the `suggestions status updatable by admin` RLS policy (gated on the
  // same app_metadata.role claim) is what actually enforces this. See
  // design.md "Admin identification via JWT app_metadata role claim".
  const isAdmin = computed(() => user.value?.app_metadata?.role === 'admin')

  // 1-indexed page, matching Nuxt UI's UPagination convention. `status`
  // defaults to 'all' (no filter) and `sort` to 'newest' here - the
  // Suggestion Box page itself is what defaults its own filter state to
  // 'new', per design.md "Status filter defaults to 'new'".
  const fetchSuggestions = async (
    { page, pageSize, status = 'all', sort = 'newest' }:
    { page: number, pageSize: number, status?: SuggestionStatusFilter, sort?: SuggestionSort }
  ): Promise<SuggestionPage> => {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('suggestions_with_author')
      .select(SUGGESTION_COLUMNS, { count: 'exact' })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // "Most Popular" still breaks score ties by newest-first, so equally
    // scored suggestions have a consistent, non-arbitrary relative order -
    // see design.md "Sorting".
    query = sort === 'popular'
      ? query.order('score', { ascending: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false })

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return {
      suggestions: (data as SuggestionWithAuthorRow[]).map(toSuggestionListEntry),
      total: count ?? 0
    }
  }

  const createSuggestion = async ({ title, body, isAnonymous }: { title: string, body: string, isAnonymous: boolean }) => {
    if (!user.value) throw new Error('Not signed in')

    const { error } = await supabase.from('suggestions').insert({
      user_id: user.value.sub,
      title,
      body,
      is_anonymous: isAnonymous
    })

    if (error) throw error
  }

  // Base-table write, not through suggestions_with_author - that view is
  // read-only usage here. Only `status` is grantable to `authenticated` at
  // the column level (see the create_suggestions_table migration), so this
  // is the only field this function - or anyone but the row owner - can
  // ever change on a suggestion.
  const updateSuggestionStatus = async (id: string, status: SuggestionStatus) => {
    const { error } = await supabase
      .from('suggestions')
      .update({ status })
      .eq('id', id)

    if (error) throw error
  }

  // `currentVote` is the caller's already-known vote state for this
  // suggestion (null/true/false, from SuggestionListEntry.myVote) - passing
  // it in avoids a read-before-write round trip. Selecting the same
  // direction already voted is the undo gesture (delete); anything else
  // (no prior vote, or the opposite direction) upserts on the
  // (user_id, suggestion_id) unique key, which both creates a first vote
  // and changes an existing one. See design.md "Voting".
  const castVote = async (suggestionId: string, isUpvote: boolean, currentVote: boolean | null) => {
    if (!user.value) throw new Error('Not signed in')

    if (currentVote === isUpvote) {
      const { error } = await supabase
        .from('suggestion_votes')
        .delete()
        .eq('suggestion_id', suggestionId)
        .eq('user_id', user.value.sub)

      if (error) throw error
      return
    }

    const { error } = await supabase
      .from('suggestion_votes')
      .upsert(
        { user_id: user.value.sub, suggestion_id: suggestionId, is_upvote: isUpvote },
        { onConflict: 'user_id,suggestion_id' }
      )

    if (error) throw error
  }

  // Base-table delete, admin-only (see the add_suggestions_delete_policy
  // migration) - permanent, no soft-delete. suggestion_votes rows for this
  // suggestion are removed automatically via on delete cascade.
  const deleteSuggestion = async (id: string) => {
    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  return {
    isAdmin,
    fetchSuggestions,
    createSuggestion,
    updateSuggestionStatus,
    castVote,
    deleteSuggestion
  }
}
