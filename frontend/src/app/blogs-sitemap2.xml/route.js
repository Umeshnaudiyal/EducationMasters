import { generateSubSitemap } from '@/utils/sitemapGenerator';

export async function GET() {
  return generateSubSitemap('blogs', 2);
}
