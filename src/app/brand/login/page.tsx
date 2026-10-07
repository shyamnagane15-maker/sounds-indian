import Link from 'next/link';
import { sendLoginLink } from '../actions';

const MESSAGES: Record<string, string> = {
  expired: 'That login link has expired or was already used. Request a new one below.',
  invalid: 'Enter a valid email address.',
  rate: 'Too many requests. Please wait a minute and try again.',
};

export default async function BrandLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;
  const errorMessage = error ? MESSAGES[error] : undefined;

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans selection:bg-gold/30">
      <nav className="max-w-md mx-auto px-6 py-8">
        <Link href="/" className="text-2xl font-serif font-black tracking-tight">
          Sounds Indian.
        </Link>
      </nav>

      <main className="max-w-md mx-auto px-6 pb-20">
        <h1 className="text-3xl font-serif mb-3">Brand login</h1>
        <p className="text-ink/80 mb-8">
          Enter the email we registered for your brand. We&apos;ll send you a link that logs you in.
          There&apos;s no password.
        </p>

        {sent && (
          <p role="status" className="mb-6 rounded-md border border-leaf/30 bg-leaf/5 p-3 text-sm text-leaf">
            If that email belongs to a registered brand, a login link is on its way. It can take a
            minute, so check your spam folder too.
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="mb-6 rounded-md border border-madder/30 bg-madder/5 p-3 text-sm text-madder">
            {errorMessage}
          </p>
        )}

        <form action={sendLoginLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-md border border-ink/20 bg-white focus:outline-none focus:border-ink"
            />
          </div>
          <button
            type="submit"
            className="bg-ink text-ivory px-6 py-3 rounded-md font-medium hover:bg-ink/90 transition-colors"
          >
            Email me a login link
          </button>
        </form>

        <p className="mt-10 text-sm text-ink/70">
          Not on Sounds Indian yet?{' '}
          <Link href="/submit" className="underline hover:text-madder">Submit your brand</Link>{' '}
          and we&apos;ll get in touch once it&apos;s approved.
        </p>
      </main>
    </div>
  );
}