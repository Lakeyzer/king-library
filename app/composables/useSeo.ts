export interface PageSeo {
  title: string
  description: string
  image?: string
}

export function useSeo() {
  const setPageSeo = ({ title, description, image }: PageSeo) => {
    const truncatedDescription = truncateDescription(description)

    useSeoMeta({
      title,
      description: truncatedDescription,
      ogTitle: title,
      ogDescription: truncatedDescription,
      twitterCard: image ? 'summary_large_image' : 'summary',
      ogImage: image,
      twitterImage: image
    })
  }

  return { setPageSeo }
}
