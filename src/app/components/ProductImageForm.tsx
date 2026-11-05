import ProductImage from './ProductImage';

type Action = (formData: FormData) => Promise<void>;

export default function ProductImageForm({
  productId,
  imageUrl,
  productName,
  category,
  uploadAction,
  removeAction,
}: {
  productId: string;
  imageUrl?: string | null;
  productName: string;
  category?: string | null;
  uploadAction: Action;
  removeAction: Action;
}) {
  return (
    <section className="mt-10 rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="text-xl font-serif">Product image</h2>
      <p className="mt-1 text-sm text-ink/60">
        One main photo. It appears on the product card and the product page.
      </p>

      <div className="mt-5 flex flex-wrap items-start gap-6">
        <ProductImage
          src={imageUrl}
          alt={productName}
          category={category}
          sizes="160px"
          className="h-40 w-40 shrink-0 rounded-xl border border-ink/10"
        />

        <div className="min-w-[16rem] flex-1">
          <form action={uploadAction} className="space-y-3">
            <input type="hidden" name="id" value={productId} />
            <input
              type="file"
              name="image"
              required
              accept="image/png,image/jpeg,image/webp"
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-4 file:py-2 file:text-ivory hover:file:bg-ink/90"
            />
            <button className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-ivory hover:bg-ink/90 transition-colors">
              {imageUrl ? 'Replace image' : 'Upload image'}
            </button>
          </form>

          {imageUrl && (
            <form action={removeAction} className="mt-3">
              <input type="hidden" name="id" value={productId} />
              <button className="text-sm text-madder underline">Remove image</button>
            </form>
          )}

          <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-ink/60">
            <li>JPG, PNG or WebP, up to 2 MB. At least 800 px on the longest side looks best.</li>
            <li>The product on a plain white or light background, centred, nothing else in the frame.</li>
            <li>Only upload photos you own or have permission to use. No other brands&apos; logos.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
