import { CATEGORIES } from '../lib/categories';
import CompareAIClient from './CompareAIClient';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export const metadata = {
  title: 'Compare AI | SoundsIndian',
  description: 'Find Indian alternatives to everyday foreign products with AI-assisted product comparisons.',
};

export default function CompareAIPage() {
  return (
    <div className="min-h-screen selection:bg-gold/30">
      <SiteHeader />
      <main>
        <CompareAIClient
          categories={CATEGORIES.filter((category) => !category.comingSoon).map((category) => ({
            slug: category.slug,
            label: category.label,
          }))}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
