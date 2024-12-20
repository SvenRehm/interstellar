// import adapter from '@sveltejs/adapter-static';
import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    //this is from the phaser template
    // adapter: adapter({
    //   precompress: false,
    //   fallback: 'index.html'
    // })
    adapter: adapter({
      //vercel config
      // see below for options that can be set here
    })
  }
}

export default config
