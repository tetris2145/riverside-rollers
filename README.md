# Riverside Rollers — Cloudflare deploy

This folder is a complete, working copy of the Riverside Rollers site, rebuilt
to run on Cloudflare instead of claude.ai. It needs no Claude account to view
or use — anyone with the link can open it.

You'll run a handful of one-time setup commands from a terminal. You need
[Node.js](https://nodejs.org) installed (any recent version) — nothing else.
Each command below uses `npx wrangler`, which downloads Cloudflare's deploy
tool on the fly, so there's nothing to install globally.

## 1. Log in to Cloudflare

```
npx wrangler login
```

This opens a browser tab — log in with the Cloudflare account you already
have, click "Allow", then come back to the terminal.

## 2. Create the data store (KV)

This is where the league's scores, players and teams live — the equivalent
of the database the claude.ai version used.

```
npx wrangler kv namespace create riverside-rollers-kv
```

It prints something like:

```
{ binding = "LEAGUE_KV", id = "abcd1234...") }
```

Copy that `id` value and paste it into `wrangler.toml` in this folder,
replacing `PASTE_YOUR_KV_NAMESPACE_ID_HERE`.

## 3. Create the photo/video storage (R2)

This is where uploaded bowler photos, team photos and Highlights videos live.

```
npx wrangler r2 bucket create riverside-rollers-media
```

(The name already matches `wrangler.toml` — no further edits needed here.)

## 4. Set the two secrets

**The secretary password** — this is what you'll type in to unlock editing
on the live site (replacing "sign in with Claude"):

```
npx wrangler pages secret put SECRETARY_PASSWORD --project-name riverside-rollers
```

It will prompt you to type a value — enter: `Billingham21`

**The auth secret** — a random key used only internally to sign login
sessions. Nobody needs to remember this one. Run:

```
npx wrangler pages secret put AUTH_SECRET --project-name riverside-rollers
```

When it prompts you to type a value, paste this (generated for you, use it
as-is):

```
617f9318c1464da7aca43d9eb7ab140a7dbaad039824e27c3f92c39e6d40431b
```

> Note: the two `secret put` commands above will actually create the Pages
> project for you the first time you run them if it doesn't exist yet. If
> either command complains the project doesn't exist yet, just run step 5
> below first, then come back and run these two commands.

## 5. Deploy

From inside this folder:

```
npx wrangler pages deploy public --project-name riverside-rollers
```

That's it. Wrangler will print your live URL — it'll be something like:

```
https://riverside-rollers.pages.dev
```

Open it. You should see the site, fully public, with a **"🔑 Secretary
login"** button top-right. Click it, type `Billingham21`, and you'll have
full editing access — add bowlers, enter scores, upload photos, generate
the PDF print sheet, all of it.

## Updating the site later

If I (Claude) send you an updated `public/index.html` or anything under
`functions/`, just drop the new files into this same folder and run the
deploy command again:

```
npx wrangler pages deploy public --project-name riverside-rollers
```

It redeploys in a few seconds. Nobody's data is affected — scores, players
and photos all live separately in KV/R2, untouched by a redeploy.

## Adding your own domain later

Once you've bought a domain (e.g. `riversiderollers.co.uk`):

1. Add the domain to Cloudflare (Cloudflare will give you nameservers to
   point your registrar at).
2. In the Cloudflare dashboard, go to your `riverside-rollers` Pages
   project → **Custom domains** → **Set up a custom domain** → enter your
   domain.

That's the whole thing — no code changes needed, and the free
`riverside-rollers.pages.dev` address keeps working alongside it.

## What changed vs. the claude.ai version

- **Viewing**: fully public, no Claude account needed — same as turning on
  "Anyone with the link" was meant to do.
- **Editing**: instead of Claude's own sign-in, there's a password
  (`Billingham21` — change it any time by re-running the `SECRETARY_PASSWORD`
  command in step 4 with a new value, then redeploying).
- **"👀 N viewing now"**: this live viewer-count feature isn't included in
  this first version — it needs extra infrastructure (a "Durable Object") to
  replicate. Everything else works the same.
- Everything else — standings, handicaps, honour roll, Print Sheet PDF
  export, photos, Highlights, archiving, the lot — works exactly as it did.
