import { generateSitemapIndex } from '@/utils/sitemapGenerator';

export async function GET() {
  return generateSitemapIndex();
}
