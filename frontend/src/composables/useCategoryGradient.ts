const categoryGradients: Record<string, string> = {
  'Electronics': 'from-slate-800 to-slate-600',
  'Beauty': 'from-rose-300 to-pink-200',
  'Food & Beverages': 'from-amber-300 to-orange-200',
  'Sports & Outdoors': 'from-emerald-400 to-teal-300',
  'Home & Garden': 'from-sky-300 to-blue-200',
}

const categoryTextColors: Record<string, string> = {
  'Electronics': 'text-slate-200',
  'Beauty': 'text-rose-700',
  'Food & Beverages': 'text-amber-800',
  'Sports & Outdoors': 'text-emerald-900',
  'Home & Garden': 'text-sky-800',
}

export function useCategoryGradient() {
  const getGradient = (category: string): string =>
    categoryGradients[category] || 'from-gray-300 to-gray-200'

  const getTextColor = (category: string): string =>
    categoryTextColors[category] || 'text-gray-600'

  return { getGradient, getTextColor }
}
