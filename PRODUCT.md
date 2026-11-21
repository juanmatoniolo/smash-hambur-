# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Hungry customers in Chajarí, Entre Ríos (Argentina), almost always on a phone. They arrive from a link shared on Instagram or WhatsApp, or by searching Google for burgers in Chajarí. Their job: see the menu and whether the place is open, pick and customize items, and send the order by WhatsApp in under a minute.

Secondary user: the owner, who edits menu, prices, hours, address, alias and social links from `/dashboard`.

## Product Purpose
Smash Burger El Toro's online menu and order builder. It turns a browse into a ready-to-send WhatsApp order (items, number of patties, notes, delivery or pickup, payment method, total). Success: more complete orders arriving on WhatsApp, and the site being found on Google and shared with a proper preview.

## Positioning
A local smash burger place in Chajarí with its own menu that the owner updates, ordering straight to the owner's WhatsApp with no marketplace in between.

## Operating Context
- Orders go out through `wa.me` with a prebuilt message; there is no payment or order backend.
- Delivery to home or pickup at the shop. Payment in cash or bank transfer (alias shown at checkout).
- Opening hours are per-day time ranges edited in the dashboard; the site shows open/closed status.
- The site is shared as a link in WhatsApp and Instagram, so the link preview (Open Graph) matters.

## Capabilities and Constraints
- Next.js 16 App Router (JavaScript) with Cache Components, CSS Modules + tokens in `globals.css`, Firebase Realtime Database + Auth, Cloudinary for photos.
- Categories: hamburguesas (shown as "Smash burgers"), papas, bebidas, otros. Burgers carry a base patty count (1 to 4) and customers can add patties up to 4; each extra patty adds the price set in the dashboard (`datos.extras.medallon`).
- Real address, WhatsApp, alias and social links come from the dashboard. Never hardcode them.
- Product photos are the owner's real photos (Cloudinary uploads or Google Drive links).

## Brand Commitments
- Name: "Smash Burger El Toro". Logo: `public/logo.png` (bull chef, flames, wood sign).
- Palette: black `#000000`, red `#FB0102`, cream `#FDF6F0`. Filled red buttons use `#E00000` so white text passes AA.
- Type: Anton (display, uppercase) + Archivo (body).
- Voice: Argentine Spanish, voseo, informal and direct ("Pedí", "Agregá", "Mirá la carta").

## Evidence on Hand
- Logo, product photos from the database.
- No testimonials, ratings, delivery times or prices beyond what the database holds. Do not invent them.

## Product Principles
1. Phone first: every decision is judged at 360-430px wide, one thumb.
2. The order must reach WhatsApp intact and correct.
3. Data from the owner is the source of truth; the site never contradicts the dashboard.
4. Shareable and findable: every share and search shows the real brand.
