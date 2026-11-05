# Product images: small edits to existing files

New files in this package are self-contained. These existing files need small edits.
(If Cursor has changed them a lot, place the snippets in the equivalent spot.)

## 0. Run once
- `npm install sharp`
- Run `product-images.sql` in the Supabase SQL Editor.

## 1. next.config.ts  (REQUIRED: without it next/image refuses Supabase images)
Add inside the config object (keep anything already there):

```ts
// near the top of the file
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// inside nextConfig
images: {
  remotePatterns: supabaseHost
    ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
    : [],
},
experimental: { serverActions: { bodySizeLimit: '3mb' } },   // was '2mb'
```
Restart `npx next dev` afterwards.

## 2. src/app/components/ProductCard.tsx  (the card on the home page)
```tsx
import ProductImage from './ProductImage';
```
Add as the FIRST child inside the card's <Link ...>, above the category/verified row:
```tsx
<ProductImage
  src={product.image_url}
  alt={product.indian_product_name}
  category={product.category}
  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 92vw"
  className="mb-5 aspect-[4/3] rounded-2xl"
/>
```
(The home page query already selects `*`, so image_url arrives automatically.)

## 3. src/app/product/[id]/page.tsx  (the comparison page)
```tsx
import ProductImage from '../../components/ProductImage';
```
At the top of the "Indian alternative" panel (above its small label):
```tsx
<ProductImage
  src={product.image_url}
  alt={product.indian_product_name}
  category={product.category}
  sizes="(min-width: 1024px) 40vw, 100vw"
  priority
  className="mb-6 aspect-square rounded-2xl"
/>
```
Optional, for nicer link previews when the page is shared, in generateMetadata's return:
```ts
openGraph: { images: product.image_url ? [product.image_url] : [] },
```

## 4. src/app/management/products/[id]/page.tsx  (admin editor)
```tsx
import ProductImageForm from '../../../components/ProductImageForm';
import { uploadProductImage, removeProductImage } from './image-actions';
```
Render it AFTER the main </form> and BEFORE the delete <details> block (forms cannot be nested):
```tsx
<ProductImageForm
  productId={product.id}
  imageUrl={product.image_url}
  productName={product.indian_product_name}
  category={product.category}
  uploadAction={uploadProductImage}
  removeAction={removeProductImage}
/>
```

## 5. src/app/brand/products/[id]/page.tsx  (brand portal, existing products only)
```tsx
import ProductImageForm from '../../../components/ProductImageForm';
import { uploadBrandProductImage, removeBrandProductImage } from './image-actions';
```
After the main </form>, before the delete <details>:
```tsx
{!isNew && (
  <ProductImageForm
    productId={product.id}
    imageUrl={product.image_url}
    productName={product.indian_product_name}
    category={product.category}
    uploadAction={uploadBrandProductImage}
    removeAction={removeBrandProductImage}
  />
)}
```
Note: a brand changing a photo sends the product back to review (the existing database trigger).

## Behaviour summary
- Uploads: JPG/PNG/WebP up to 2 MB. Re-encoded to WebP (max 1200 px), EXIF/GPS stripped, random file name.
- Bucket: product-images (public). Old files are deleted when a photo is replaced or removed.
- Products without a photo show a category icon placeholder.
- Only the Indian product has a photo. Foreign products show no photo (avoids copyright problems).
