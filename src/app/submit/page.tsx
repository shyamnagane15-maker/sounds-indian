'use client';

import { CATEGORIES } from '../lib/categories';
import { useActionState } from 'react';
import Link from 'next/link';
import { submitBrand, type SubmitState } from './actions';

const initialState: SubmitState = { ok: false };

const inputClass =
  'w-full px-3 py-2.5 rounded-md border border-ink/20 bg-white focus:outline-none focus:border-ink';
const labelClass = 'block text-sm font-medium mb-1';
const hintClass = 'text-xs text-ink/60 mt-1';

export default function SubmitBrandPage() {
  const [state, formAction, pending] = useActionState(submitBrand, initialState);
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="min-h-screen bg-ivory text-ink font-sans">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-serif mb-4">Thanks, we&apos;ve got your submission.</h1>
          <p className="text-ink/80 mb-8">
            We&apos;ll check your CIN and product details. If we need anything, we&apos;ll write to
            the email you gave us. Products only appear on the site after we verify them.
          </p>
          <Link href="/" className="text-sm font-medium border-b border-ink hover:text-madder transition-colors">
            Back to Sounds Indian
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans selection:bg-gold/30">
      <nav className="max-w-2xl mx-auto px-6 py-8">
        <Link href="/" className="text-2xl font-serif font-black tracking-tight">
          Sounds Indian.
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pb-20">
        <h1 className="text-4xl font-serif leading-tight mb-3">Submit your brand</h1>
        <p className="text-ink/80 mb-10">
          Tell us about your brand and the products that replace a foreign alternative. We verify
          every claim before anything goes live.
        </p>

        <form action={formAction} className="space-y-10">
          {/* Honeypot: hidden from people, filled in by bots */}
          <div aria-hidden="true" className="absolute -left-[9999px]">
            <label>
              Leave this empty
              <input type="text" name="hp_field" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {/* About the brand */}
          <section className="space-y-5">
            <h2 className="text-xl font-serif">About the brand</h2>

            <div>
              <label htmlFor="brand_name" className={labelClass}>Brand name</label>
              <input id="brand_name" name="brand_name" required maxLength={100}
                defaultValue={v.brand_name} className={inputClass} />
            </div>

            <div>
              <label htmlFor="location" className={labelClass}>Location</label>
              <input id="location" name="location" required maxLength={100}
                placeholder="City, State" defaultValue={v.location} className={inputClass} />
            </div>

            <div>
              <label htmlFor="founding_story" className={labelClass}>Founding story</label>
              <textarea id="founding_story" name="founding_story" rows={4} maxLength={1500}
                defaultValue={v.founding_story} className={inputClass} />
              <p className={hintClass}>Optional. Who started it, and why.</p>
            </div>

            <div>
              <label htmlFor="logo" className={labelClass}>Brand logo</label>
              <input id="logo" name="logo" type="file" required
                accept="image/png,image/jpeg,image/webp"
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-4 file:py-2 file:text-ivory hover:file:bg-ink/90" />
              <p className={hintClass}>PNG, JPG or WebP, up to 1 MB.</p>
            </div>
          </section>

          {/* Registration and contact */}
          <section className="space-y-5">
            <h2 className="text-xl font-serif">Registration and contact</h2>

            <div>
              <label htmlFor="cin" className={labelClass}>
                CIN (Corporate Identification Number)
              </label>
              <input id="cin" name="cin" required maxLength={21}
                pattern="[LUlu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}"
                title="21 characters, like U12345MH2020PTC123456"
                placeholder="U12345MH2020PTC123456" defaultValue={v.cin}
                className={`${inputClass} font-mono uppercase`} />
              <p className={hintClass}>
                21 characters, found on your company&apos;s registration documents. We check it
                against the government&apos;s company records.
              </p>
            </div>

            <div>
              <label htmlFor="contact_email" className={labelClass}>Contact email</label>
              <input id="contact_email" name="contact_email" type="email" required
                defaultValue={v.contact_email} className={inputClass} />
              <p className={hintClass}>Private. We only use it to reach you about this submission.</p>
            </div>

            <div>
              <label htmlFor="website" className={labelClass}>Website</label>
              <input id="website" name="website" type="url"
                placeholder="https://" defaultValue={v.website} className={inputClass} />
              <p className={hintClass}>Optional.</p>
            </div>
          </section>

          {/* Products */}
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-serif">Products</h2>
              <p className={hintClass}>Add up to three. You can add more after your brand is approved.</p>
            </div>

            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-ink/10 bg-white p-4 space-y-4">
                <p className="text-sm font-medium">
                  Product {i}{i > 1 && ' (optional)'}
                </p>
                <div>
                  <label htmlFor={`indian_name_${i}`} className={labelClass}>Your product</label>
                  <input id={`indian_name_${i}`} name={`indian_name_${i}`} required={i === 1}
                    maxLength={150} defaultValue={v[`indian_name_${i}`]} className={inputClass} />
                </div>
                <div>
                  <label htmlFor={`foreign_name_${i}`} className={labelClass}>Foreign product it replaces</label>
                  <input id={`foreign_name_${i}`} name={`foreign_name_${i}`} required={i === 1}
                    maxLength={150} defaultValue={v[`foreign_name_${i}`]} className={inputClass} />
                </div>
                <div>
  <label htmlFor={`category_${i}`} className={labelClass}>Category</label>
  <select id={`category_${i}`} name={`category_${i}`} required={i === 1}
    defaultValue={v[`category_${i}`] ?? ''} className={inputClass}>
    <option value="">Choose a category</option>
    {CATEGORIES.map((c) => (
      <option key={c.slug} value={c.slug}>{c.label}</option>
    ))}
  </select>
  <p className={hintClass}>
    Pick Ayurvedic / natural only if you position the product as Ayurvedic or herbal.
  </p>
</div>
                <div>
                  <label htmlFor={`buy_url_${i}`} className={labelClass}>Link to buy</label>
                  <input id={`buy_url_${i}`} name={`buy_url_${i}`} type="url" required={i === 1}
                    placeholder="https://" defaultValue={v[`buy_url_${i}`]} className={inputClass} />
                </div>
              </div>
            ))}
          </section>

          {/* Notes */}
          <section>
            <label htmlFor="notes" className={labelClass}>Anything else we should know?</label>
            <textarea id="notes" name="notes" rows={3} maxLength={1000}
              defaultValue={v.notes} className={inputClass} />
            <p className={hintClass}>Optional. For example, certifications, test reports or sourcing details.</p>
          </section>

          {state.error && (
            <p role="alert" className="rounded-md border border-madder/30 bg-madder/5 p-3 text-sm text-madder">
              {state.error} Your logo needs to be selected again.
            </p>
          )}

          <button type="submit" disabled={pending}
            className="bg-ink text-ivory px-6 py-3 rounded-md font-medium hover:bg-ink/90 transition-colors disabled:opacity-60">
            {pending ? 'Submitting…' : 'Submit brand'}
          </button>
        </form>
      </main>
    </div>
  );
}