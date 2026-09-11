// Bin taxonomy — the single source of truth for the whole app.
export const BINS = {
  WET: {
    id: 'WET', label: 'Wet Bin', tagline: 'Food & organic waste',
    color: '#15803D', bg: 'bin-wet',
    examples: ['Banana peel', 'Leftover rice', 'Tea leaves', 'Eggshells', 'Vegetable scraps', 'Coconut shells & flowers'],
    dos: ['Empty liquids first', 'Keep food scraps loose or in compostable bags', 'Close lid to avoid odour'],
    donts: ['No plastic wrappers', 'No glass or metal', 'No e-waste / batteries'],
    tip: 'Wet waste becomes compost in 4–6 weeks when kept clean.'
  },
  DRY: {
    id: 'DRY', label: 'Dry Bin', tagline: 'Non-recyclable dry waste',
    color: '#475569', bg: 'bin-dry',
    examples: ['Chips packets', 'Tissues', 'Styrofoam', 'Greasy pizza box', 'Sanitary waste', 'Broken ceramics'],
    dos: ['Keep items dry', 'Wrap sanitary waste in paper', 'Flatten bulky items'],
    donts: ['No food scraps', 'No clean recyclables — put them in Recyclable', 'No batteries / electronics'],
    tip: 'If it is dirty, mixed-material, and not electronic — it is Dry.'
  },
  RECYCLABLE: {
    id: 'RECYCLABLE', label: 'Recyclable Bin', tagline: 'Clean paper, plastic, metal, glass',
    color: '#2563EB', bg: 'bin-recyclable',
    examples: ['PET bottle', 'Newspaper', 'Cardboard box', 'Aluminium can', 'Glass jar', 'Milk carton (rinsed)'],
    dos: ['Rinse containers', 'Flatten cardboard', 'Keep paper dry & clean'],
    donts: ['No food-soiled paper', 'No chip packets / multilayer plastic', 'No broken tube-lights'],
    tip: 'One dirty item can contaminate a whole bag — rinse for 5 seconds.'
  },
  E_WASTE: {
    id: 'E_WASTE', label: 'E-Waste Bin', tagline: 'Electronics, batteries, cables',
    color: '#7C3AED', bg: 'bin-ewaste',
    examples: ['AA batteries', 'Phone charger', 'Old phone', 'LED bulb', 'Earphones', 'Laptop battery'],
    dos: ['Tape battery terminals', 'Keep items intact', 'Hand over to authorised recycler'],
    donts: ['Never mix with wet/dry bins', 'Do not break bulbs or batteries', 'Do not burn or dump'],
    tip: 'Batteries in regular bins cause fires. Always use E-Waste.'
  }
}

export const BIN_LIST = Object.values(BINS)
export const BIN_IDS = Object.keys(BINS)
export const binById = (id) => BINS[id] ?? BINS.DRY
