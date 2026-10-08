/**
 * Indian States and Union Territories Dictionary
 * Pure data module safe for both Server and Client Components
 */

export const INDIAN_STATES_DATA = [
  { name: 'Andaman & Nicobar', slug: 'andaman-nicobar', aliases: ['andaman nicobar', 'andaman and nicobar', 'andaman', 'nicobar'] },
  { name: 'Andhra Pradesh', slug: 'andhra-pradesh', aliases: ['andhra pradesh', 'andhra', 'ap'] },
  { name: 'Arunachal Pradesh', slug: 'arunchal-pradesh', aliases: ['arunachal pradesh', 'arunchal pradesh', 'arunachal', 'arunchal'] },
  { name: 'Assam', slug: 'assam', aliases: ['assam', 'as'] },
  { name: 'Bihar', slug: 'bihar', aliases: ['bihar', 'br'] },
  { name: 'Chandigarh', slug: 'chandigarh', aliases: ['chandigarh', 'ch'] },
  { name: 'Chhattisgarh', slug: 'chhatisgarh', aliases: ['chhattisgarh', 'chhatisgarh', 'cg'] },
  { name: 'Dadra & Nagar Haveli and Daman & Diu', slug: 'dadra-nagar-haveli-and-daman-diu', aliases: ['dadra & nagar haveli', 'daman and diu', 'daman & diu', 'dadra nagar haveli', 'daman', 'diu'] },
  { name: 'Delhi', slug: 'delhi', aliases: ['delhi', 'nct of delhi', 'new delhi', 'dl'] },
  { name: 'Goa', slug: 'goa', aliases: ['goa', 'ga'] },
  { name: 'Gujarat', slug: 'gujarat', aliases: ['gujarat', 'gj'] },
  { name: 'Haryana', slug: 'haryana', aliases: ['haryana', 'hr'] },
  { name: 'Himachal Pradesh', slug: 'himachal-pradesh', aliases: ['himachal pradesh', 'himachal', 'hp'] },
  { name: 'Jammu & Kashmir', slug: 'jammu-kashmir', aliases: ['jammu & kashmir', 'jammu and kashmir', 'jammu kashmir', 'jammu', 'kashmir', 'j&k', 'jk'] },
  { name: 'Jharkhand', slug: 'jharkhand', aliases: ['jharkhand', 'jh'] },
  { name: 'Karnataka', slug: 'karnataka', aliases: ['karnataka', 'karnatka', 'ka'] },
  { name: 'Kerala', slug: 'kerala', aliases: ['kerala', 'kl'] },
  { name: 'Ladakh', slug: 'laddakh', aliases: ['ladakh', 'laddakh', 'la'] },
  { name: 'Lakshadweep', slug: 'lakshadweep', aliases: ['lakshadweep', 'ld'] },
  { name: 'Madhya Pradesh', slug: 'madhya-pradesh', aliases: ['madhya pradesh', 'mp'] },
  { name: 'Maharashtra', slug: 'maharashtra', aliases: ['maharashtra', 'mh'] },
  { name: 'Manipur', slug: 'manipur', aliases: ['manipur', 'mn'] },
  { name: 'Meghalaya', slug: 'meghalaya', aliases: ['meghalaya', 'ml'] },
  { name: 'Mizoram', slug: 'mizoram', aliases: ['mizoram', 'mz'] },
  { name: 'Nagaland', slug: 'nagaland', aliases: ['nagaland', 'nl'] },
  { name: 'Odisha', slug: 'odisha', aliases: ['odisha', 'orissa', 'od', 'or'] },
  { name: 'Puducherry', slug: 'pondicherry', aliases: ['puducherry', 'pondicherry', 'py'] },
  { name: 'Punjab', slug: 'punjab', aliases: ['punjab', 'pb'] },
  { name: 'Rajasthan', slug: 'rajasthan', aliases: ['rajasthan', 'rj'] },
  { name: 'Sikkim', slug: 'sikkim', aliases: ['sikkim', 'sk'] },
  { name: 'Tamil Nadu', slug: 'tamil-nadu', aliases: ['tamil nadu', 'tamilnadu', 'tn'] },
  { name: 'Telangana', slug: 'telangana', aliases: ['telangana', 'ts', 'tg'] },
  { name: 'Tripura', slug: 'tripura', aliases: ['tripura', 'tr'] },
  { name: 'Uttar Pradesh', slug: 'uttar-pradesh', aliases: ['uttar pradesh', 'up'] },
  { name: 'Uttarakhand', slug: 'uttarakhand', aliases: ['uttarakhand', 'uttaranchal', 'uk'] },
  { name: 'West Bengal', slug: 'west-bengal', aliases: ['west bengal', 'bengal', 'wb'] },
];

export function getStateNameBySlug(slug) {
  if (!slug) return 'India';
  const clean = String(slug).toLowerCase().trim();
  const match = INDIAN_STATES_DATA.find(
    (s) => s.slug === clean || s.name.toLowerCase() === clean || (s.aliases && s.aliases.includes(clean))
  );
  return match ? match.name : clean.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
