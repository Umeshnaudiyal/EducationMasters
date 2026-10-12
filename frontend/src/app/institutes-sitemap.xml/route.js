import { generateSubSitemap } from '@/utils/sitemapGenerator';

export async function GET() {
  return generateSubSitemap('institutes', 1);
}
