import type { KingWork } from "~/composables/useKingWorks"
import type { KingShortStory } from "~/composables/useShortStories"
import type { Adaptation } from "~/composables/useAdaptations"

export interface GlobalSearchResultItem {
  id: string
  label: string
  icon: string
  to: string
  disabled?: boolean
}

export interface GlobalSearchGroup {
  id: string
  label: string
  ignoreFilter: true
  items: GlobalSearchResultItem[]
}

function matchesTitle(title: string, term: string) {
  return title.toLowerCase().includes(term.toLowerCase())
}

// UCommandPalette drops any group whose items array is empty, so an
// unmatched category is represented by a single disabled placeholder item
// instead - that's what keeps its label visible per the global-search spec.
function toGroup(id: string, label: string, icon: string, items: GlobalSearchResultItem[]): GlobalSearchGroup {
  return {
    id,
    label,
    ignoreFilter: true,
    items: items.length ? items : [{ id: `${id}-empty`, label: "No matches", icon, to: "", disabled: true }]
  }
}

export function useGlobalSearch() {
  const { fetchKingWorks } = useKingWorks()
  const { fetchShortStories } = useShortStories()
  const { fetchAdaptations } = useAdaptations()

  const works = useState<KingWork[]>("globalSearchWorks", () => [])
  const shortStories = useState<KingShortStory[]>("globalSearchShortStories", () => [])
  const adaptations = useState<Adaptation[]>("globalSearchAdaptations", () => [])
  const isLoaded = useState("globalSearchLoaded", () => false)
  const searchTerm = useState("globalSearchTerm", () => "")
  const debouncedSearchTerm = useState("globalSearchDebouncedTerm", () => "")

  // The palette's input binds to `searchTerm` directly so typing stays
  // instant; filtering below reacts to `debouncedSearchTerm` instead so it
  // doesn't recompute on every keystroke. Clearing the term (backspacing to
  // empty, or closing the dialog) skips the wait so results don't linger.
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(searchTerm, (term) => {
    clearTimeout(debounceTimer)

    if (!term) {
      debouncedSearchTerm.value = term
      return
    }

    debounceTimer = setTimeout(() => {
      debouncedSearchTerm.value = term
    }, 500)
  })

  const ensureLoaded = async () => {
    if (isLoaded.value) return

    const [worksData, shortStoriesData, adaptationsData] = await Promise.all([
      fetchKingWorks(),
      fetchShortStories(),
      fetchAdaptations()
    ])

    works.value = worksData
    shortStories.value = shortStoriesData
    adaptations.value = adaptationsData
    isLoaded.value = true
  }

  const groups = computed<GlobalSearchGroup[]>(() => {
    const term = debouncedSearchTerm.value.trim()
    if (!term) return []

    return [
      toGroup(
        "works",
        "Works",
        "i-lucide-book",
        works.value
          .filter((work) => matchesTitle(work.title, term))
          .map((work) => ({ id: work.id, label: work.title, icon: "i-lucide-book", to: `/works/${work.slug}` }))
      ),
      toGroup(
        "short-stories",
        "Short Stories",
        "i-lucide-file-text",
        shortStories.value
          .filter((story) => matchesTitle(story.title, term))
          .map((story) => ({ id: story.id, label: story.title, icon: "i-lucide-file-text", to: `/short-works/${story.slug}` }))
      ),
      toGroup(
        "adaptations",
        "Adaptations",
        "i-lucide-clapperboard",
        adaptations.value
          .filter((adaptation) => matchesTitle(adaptation.title, term))
          .map((adaptation) => ({ id: adaptation.id, label: adaptation.title, icon: "i-lucide-clapperboard", to: `/adaptations/${adaptation.slug}` }))
      )
    ]
  })

  return { searchTerm, groups, ensureLoaded }
}
