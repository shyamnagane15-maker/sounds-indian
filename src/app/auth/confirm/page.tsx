import Link from 'next/link';
import { confirmLogin } from './actions';

// The email link lands here. Logging in only happens when the person clicks the
// button, so email security scanners that "open" links can't use the link up.
export default async function ConfirmLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash } = await searchParams;

  return (
    <div className="min-h-screen bg-ivory text-ink font-sans">
      <nav className="max-w-md mx-auto px-6 py-8">
        <Link href="/" className="text-2xl font-serif font-black tracking-tight">
          Sounds Indian.
        </Link>
      </nav>

      <main className="max-w-md mx-auto px-6 pb-20">
        {token_hash ? (
          <>
            <h1 className="text-3xl font-serif mb-3">One more step</h1>
            <p className="text-ink/80 mb-8">Click the button to log in to your brand dashboard.</p>
            <form action={confirmLogin}>
              <input type="hidden" name="token_hash" value={token_hash} />
              <button
                type="submit"
                className="bg-ink text-ivory px-6 py-3 rounded-md font-medium hover:bg-ink/90 transition-colors"
              >
                Continue to my dashboard
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-serif mb-3">This link isn&apos;t valid</h1>
            <p className="text-ink/80 mb-8">The login link is incomplete. Request a new one.</p>
            <Link href="/brand/login" className="underline hover:text-madder">
              Go to brand login
            </Link>
          </>
        )}
      </main>
    </div>
  );
}