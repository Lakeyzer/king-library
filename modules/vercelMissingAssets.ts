import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineNuxtModule } from 'nuxt/kit'

// On Vercel, a request for a file that doesn't exist falls through to the Nuxt
// server function, which cold-starts and renders a full 404 page. Requests for
// /_nuxt/* chunks from earlier builds (crawlers replaying old page snapshots,
// tabs left open on an old version) arrive in bursts of ~50 and had become most
// of the remaining function CPU once public pages were cached. Built assets are
// immutable and either exist or never will, so a missing one is answered with a
// plain 404 by Vercel's router - no function involved.
//
// Nitro has no option for this: routes from its `vercel.config` are placed
// before the static-file check, which would 404 the real assets too. So this
// adds the rule to the generated .vercel/output/config.json right after the
// `filesystem` handle - existing files have already been served by then.
// Registered from `nitro:init`, so it runs after the vercel preset's own
// `compiled` hook has written that file.
export default defineNuxtModule({
  meta: { name: 'vercel-missing-assets' },
  setup(_options, nuxt) {
    const assetsPrefix = nuxt.options.app.buildAssetsDir.replace(/\/+$/, '')

    nuxt.hook('nitro:init', (nitro) => {
      if (!nitro.options.preset.startsWith('vercel')) return

      nitro.hooks.hook('compiled', async () => {
        const configPath = join(nitro.options.output.dir, 'config.json')
        const config = JSON.parse(await readFile(configPath, 'utf8')) as {
          routes: { handle?: string, src?: string, status?: number }[]
        }

        const filesystemIndex = config.routes.findIndex(route => route.handle === 'filesystem')
        if (filesystemIndex === -1) {
          throw new Error('[vercel-missing-assets] No filesystem handle in .vercel/output/config.json')
        }

        config.routes.splice(filesystemIndex + 1, 0, {
          src: `^${assetsPrefix}/(.*)$`,
          status: 404
        })

        await writeFile(configPath, JSON.stringify(config, null, 2))
      })
    })
  }
})
