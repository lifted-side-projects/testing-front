export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'

export interface ChemElement {
  z: number         // atomic number
  symbol: string
  nameRu: string
  mass: number      // atomic mass
  period: number
  group: number     // 1-18, 0 for lanthanides/actinides
  category: ElementCategory
  electronConfig?: string
  oxidationStates?: string
  electronegativity?: number
  entRelevance?: string
  block: 's' | 'p' | 'd' | 'f'
}

export const CATEGORY_COLORS: Record<ElementCategory, string> = {
  'alkali-metal':    '#e76f51',
  'alkaline-earth':  '#e8b931',
  'transition-metal':'#52b788',
  'post-transition': '#7a8ba6',
  'metalloid':       '#9d4edd',
  'nonmetal':        '#4ea8de',
  'halogen':         '#f4845f',
  'noble-gas':       '#48bfe3',
  'lanthanide':      '#bc6c25',
  'actinide':        '#8338ec',
}

export const CATEGORY_NAMES_RU: Record<ElementCategory, string> = {
  'alkali-metal':    'Щелочные',
  'alkaline-earth':  'Щёл.-земельные',
  'transition-metal':'Переходные',
  'post-transition': 'Постпереходные',
  'metalloid':       'Металлоиды',
  'nonmetal':        'Неметаллы',
  'halogen':         'Галогены',
  'noble-gas':       'Благородные газы',
  'lanthanide':      'Лантаноиды',
  'actinide':        'Актиноиды',
}

// Standard periodic table grid positions
// group: 1-18, period: 1-7 (+ 8,9 for lanthanides/actinides row)
export interface GridPosition {
  row: number
  col: number
}

export function getGridPosition(el: ChemElement): GridPosition {
  // Lanthanides (57-71): separate row 8
  if (el.z >= 57 && el.z <= 71) {
    return { row: 8, col: el.z - 57 + 3 }
  }
  // Actinides (89-103): separate row 9
  if (el.z >= 89 && el.z <= 103) {
    return { row: 9, col: el.z - 89 + 3 }
  }
  return { row: el.period, col: el.group }
}

export const ELEMENTS: ChemElement[] = [
  // Period 1
  { z: 1, symbol: 'H', nameRu: 'Водород', mass: 1.008, period: 1, group: 1, category: 'nonmetal', block: 's', electronConfig: '1s¹', oxidationStates: '-1, +1', electronegativity: 2.20, entRelevance: 'Основа кислот, восстановитель, связи в органике' },
  { z: 2, symbol: 'He', nameRu: 'Гелий', mass: 4.003, period: 1, group: 18, category: 'noble-gas', block: 's', electronConfig: '1s²', oxidationStates: '0', electronegativity: undefined, entRelevance: 'Инертный газ, стабильная электронная конфигурация' },

  // Period 2
  { z: 3, symbol: 'Li', nameRu: 'Литий', mass: 6.941, period: 2, group: 1, category: 'alkali-metal', block: 's', electronConfig: '[He]2s¹', oxidationStates: '+1', electronegativity: 0.98, entRelevance: 'Типичный щелочной металл, сильный восстановитель' },
  { z: 4, symbol: 'Be', nameRu: 'Бериллий', mass: 9.012, period: 2, group: 2, category: 'alkaline-earth', block: 's', electronConfig: '[He]2s²', oxidationStates: '+2', electronegativity: 1.57, entRelevance: 'Амфотерный элемент' },
  { z: 5, symbol: 'B', nameRu: 'Бор', mass: 10.81, period: 2, group: 13, category: 'metalloid', block: 'p', electronConfig: '[He]2s²2p¹', oxidationStates: '+3', electronegativity: 2.04, entRelevance: 'Металлоид, бораны' },
  { z: 6, symbol: 'C', nameRu: 'Углерод', mass: 12.01, period: 2, group: 14, category: 'nonmetal', block: 'p', electronConfig: '[He]2s²2p²', oxidationStates: '-4, +2, +4', electronegativity: 2.55, entRelevance: 'Основа органической химии, аллотропия' },
  { z: 7, symbol: 'N', nameRu: 'Азот', mass: 14.01, period: 2, group: 15, category: 'nonmetal', block: 'p', electronConfig: '[He]2s²2p³', oxidationStates: '-3, +1 to +5', electronegativity: 3.04, entRelevance: 'Аммиак, нитраты, азотная кислота, белки' },
  { z: 8, symbol: 'O', nameRu: 'Кислород', mass: 16.00, period: 2, group: 16, category: 'nonmetal', block: 'p', electronConfig: '[He]2s²2p⁴', oxidationStates: '-2, -1', electronegativity: 3.44, entRelevance: 'Окислитель, оксиды, горение, дыхание' },
  { z: 9, symbol: 'F', nameRu: 'Фтор', mass: 19.00, period: 2, group: 17, category: 'halogen', block: 'p', electronConfig: '[He]2s²2p⁵', oxidationStates: '-1', electronegativity: 3.98, entRelevance: 'Самый сильный окислитель, максимальная ЭО' },
  { z: 10, symbol: 'Ne', nameRu: 'Неон', mass: 20.18, period: 2, group: 18, category: 'noble-gas', block: 'p', electronConfig: '[He]2s²2p⁶', oxidationStates: '0', entRelevance: 'Инертный газ' },

  // Period 3
  { z: 11, symbol: 'Na', nameRu: 'Натрий', mass: 22.99, period: 3, group: 1, category: 'alkali-metal', block: 's', electronConfig: '[Ne]3s¹', oxidationStates: '+1', electronegativity: 0.93, entRelevance: 'Щелочной металл, NaOH, NaCl, реакции с водой' },
  { z: 12, symbol: 'Mg', nameRu: 'Магний', mass: 24.31, period: 3, group: 2, category: 'alkaline-earth', block: 's', electronConfig: '[Ne]3s²', oxidationStates: '+2', electronegativity: 1.31, entRelevance: 'Горение, MgO, хлорофилл' },
  { z: 13, symbol: 'Al', nameRu: 'Алюминий', mass: 26.98, period: 3, group: 13, category: 'post-transition', block: 'p', electronConfig: '[Ne]3s²3p¹', oxidationStates: '+3', electronegativity: 1.61, entRelevance: 'Амфотерный металл, алюмотермия, оксидная плёнка' },
  { z: 14, symbol: 'Si', nameRu: 'Кремний', mass: 28.09, period: 3, group: 14, category: 'metalloid', block: 'p', electronConfig: '[Ne]3s²3p²', oxidationStates: '-4, +4', electronegativity: 1.90, entRelevance: 'Силикаты, стекло, полупроводники' },
  { z: 15, symbol: 'P', nameRu: 'Фосфор', mass: 30.97, period: 3, group: 15, category: 'nonmetal', block: 'p', electronConfig: '[Ne]3s²3p³', oxidationStates: '-3, +3, +5', electronegativity: 2.19, entRelevance: 'Аллотропия, фосфорная кислота, удобрения' },
  { z: 16, symbol: 'S', nameRu: 'Сера', mass: 32.07, period: 3, group: 16, category: 'nonmetal', block: 'p', electronConfig: '[Ne]3s²3p⁴', oxidationStates: '-2, +4, +6', electronegativity: 2.58, entRelevance: 'Серная кислота, сульфиды, сульфаты' },
  { z: 17, symbol: 'Cl', nameRu: 'Хлор', mass: 35.45, period: 3, group: 17, category: 'halogen', block: 'p', electronConfig: '[Ne]3s²3p⁵', oxidationStates: '-1, +1 to +7', electronegativity: 3.16, entRelevance: 'HCl, хлориды, дезинфекция, ОВР' },
  { z: 18, symbol: 'Ar', nameRu: 'Аргон', mass: 39.95, period: 3, group: 18, category: 'noble-gas', block: 'p', electronConfig: '[Ne]3s²3p⁶', oxidationStates: '0', entRelevance: 'Инертный газ, сварка' },

  // Period 4
  { z: 19, symbol: 'K', nameRu: 'Калий', mass: 39.10, period: 4, group: 1, category: 'alkali-metal', block: 's', electronConfig: '[Ar]4s¹', oxidationStates: '+1', electronegativity: 0.82, entRelevance: 'Щелочной металл, KOH, удобрения' },
  { z: 20, symbol: 'Ca', nameRu: 'Кальций', mass: 40.08, period: 4, group: 2, category: 'alkaline-earth', block: 's', electronConfig: '[Ar]4s²', oxidationStates: '+2', electronegativity: 1.00, entRelevance: 'CaCO₃, жёсткость воды, цемент' },
  { z: 21, symbol: 'Sc', nameRu: 'Скандий', mass: 44.96, period: 4, group: 3, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d¹4s²', oxidationStates: '+3' },
  { z: 22, symbol: 'Ti', nameRu: 'Титан', mass: 47.87, period: 4, group: 4, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d²4s²', oxidationStates: '+2, +3, +4' },
  { z: 23, symbol: 'V', nameRu: 'Ванадий', mass: 50.94, period: 4, group: 5, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d³4s²', oxidationStates: '+2 to +5' },
  { z: 24, symbol: 'Cr', nameRu: 'Хром', mass: 52.00, period: 4, group: 6, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d⁵4s¹', oxidationStates: '+2, +3, +6', electronegativity: 1.66, entRelevance: 'Провал электрона, хроматы, дихроматы' },
  { z: 25, symbol: 'Mn', nameRu: 'Марганец', mass: 54.94, period: 4, group: 7, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d⁵4s²', oxidationStates: '+2, +4, +7', electronegativity: 1.55, entRelevance: 'KMnO₄ — окислитель в ОВР' },
  { z: 26, symbol: 'Fe', nameRu: 'Железо', mass: 55.85, period: 4, group: 8, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d⁶4s²', oxidationStates: '+2, +3', electronegativity: 1.83, entRelevance: 'Коррозия, сплавы, ОВР, гемоглобин' },
  { z: 27, symbol: 'Co', nameRu: 'Кобальт', mass: 58.93, period: 4, group: 9, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d⁷4s²', oxidationStates: '+2, +3' },
  { z: 28, symbol: 'Ni', nameRu: 'Никель', mass: 58.69, period: 4, group: 10, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d⁸4s²', oxidationStates: '+2' },
  { z: 29, symbol: 'Cu', nameRu: 'Медь', mass: 63.55, period: 4, group: 11, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d¹⁰4s¹', oxidationStates: '+1, +2', electronegativity: 1.90, entRelevance: 'Провал электрона, CuSO₄, электролиз' },
  { z: 30, symbol: 'Zn', nameRu: 'Цинк', mass: 65.38, period: 4, group: 12, category: 'transition-metal', block: 'd', electronConfig: '[Ar]3d¹⁰4s²', oxidationStates: '+2', electronegativity: 1.65, entRelevance: 'Амфотерный, оцинковка, ряд напряжений' },
  { z: 31, symbol: 'Ga', nameRu: 'Галлий', mass: 69.72, period: 4, group: 13, category: 'post-transition', block: 'p', electronConfig: '[Ar]3d¹⁰4s²4p¹', oxidationStates: '+3' },
  { z: 32, symbol: 'Ge', nameRu: 'Германий', mass: 72.63, period: 4, group: 14, category: 'metalloid', block: 'p', electronConfig: '[Ar]3d¹⁰4s²4p²', oxidationStates: '+2, +4' },
  { z: 33, symbol: 'As', nameRu: 'Мышьяк', mass: 74.92, period: 4, group: 15, category: 'metalloid', block: 'p', electronConfig: '[Ar]3d¹⁰4s²4p³', oxidationStates: '-3, +3, +5' },
  { z: 34, symbol: 'Se', nameRu: 'Селен', mass: 78.97, period: 4, group: 16, category: 'nonmetal', block: 'p', electronConfig: '[Ar]3d¹⁰4s²4p⁴', oxidationStates: '-2, +4, +6' },
  { z: 35, symbol: 'Br', nameRu: 'Бром', mass: 79.90, period: 4, group: 17, category: 'halogen', block: 'p', electronConfig: '[Ar]3d¹⁰4s²4p⁵', oxidationStates: '-1, +1, +5', electronegativity: 2.96, entRelevance: 'Жидкий галоген, бромная вода, качественные реакции' },
  { z: 36, symbol: 'Kr', nameRu: 'Криптон', mass: 83.80, period: 4, group: 18, category: 'noble-gas', block: 'p', electronConfig: '[Ar]3d¹⁰4s²4p⁶', oxidationStates: '0' },

  // Period 5
  { z: 37, symbol: 'Rb', nameRu: 'Рубидий', mass: 85.47, period: 5, group: 1, category: 'alkali-metal', block: 's', electronConfig: '[Kr]5s¹', oxidationStates: '+1' },
  { z: 38, symbol: 'Sr', nameRu: 'Стронций', mass: 87.62, period: 5, group: 2, category: 'alkaline-earth', block: 's', electronConfig: '[Kr]5s²', oxidationStates: '+2' },
  { z: 39, symbol: 'Y', nameRu: 'Иттрий', mass: 88.91, period: 5, group: 3, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d¹5s²', oxidationStates: '+3' },
  { z: 40, symbol: 'Zr', nameRu: 'Цирконий', mass: 91.22, period: 5, group: 4, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d²5s²', oxidationStates: '+4' },
  { z: 41, symbol: 'Nb', nameRu: 'Ниобий', mass: 92.91, period: 5, group: 5, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d⁴5s¹', oxidationStates: '+3, +5' },
  { z: 42, symbol: 'Mo', nameRu: 'Молибден', mass: 95.95, period: 5, group: 6, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d⁵5s¹', oxidationStates: '+4, +6' },
  { z: 43, symbol: 'Tc', nameRu: 'Технеций', mass: 98, period: 5, group: 7, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d⁵5s²', oxidationStates: '+4, +7' },
  { z: 44, symbol: 'Ru', nameRu: 'Рутений', mass: 101.1, period: 5, group: 8, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d⁷5s¹', oxidationStates: '+3, +4' },
  { z: 45, symbol: 'Rh', nameRu: 'Родий', mass: 102.9, period: 5, group: 9, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d⁸5s¹', oxidationStates: '+3' },
  { z: 46, symbol: 'Pd', nameRu: 'Палладий', mass: 106.4, period: 5, group: 10, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d¹⁰', oxidationStates: '+2, +4' },
  { z: 47, symbol: 'Ag', nameRu: 'Серебро', mass: 107.9, period: 5, group: 11, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d¹⁰5s¹', oxidationStates: '+1', electronegativity: 1.93, entRelevance: 'Качественные реакции на хлориды (AgCl)' },
  { z: 48, symbol: 'Cd', nameRu: 'Кадмий', mass: 112.4, period: 5, group: 12, category: 'transition-metal', block: 'd', electronConfig: '[Kr]4d¹⁰5s²', oxidationStates: '+2' },
  { z: 49, symbol: 'In', nameRu: 'Индий', mass: 114.8, period: 5, group: 13, category: 'post-transition', block: 'p', electronConfig: '[Kr]4d¹⁰5s²5p¹', oxidationStates: '+3' },
  { z: 50, symbol: 'Sn', nameRu: 'Олово', mass: 118.7, period: 5, group: 14, category: 'post-transition', block: 'p', electronConfig: '[Kr]4d¹⁰5s²5p²', oxidationStates: '+2, +4' },
  { z: 51, symbol: 'Sb', nameRu: 'Сурьма', mass: 121.8, period: 5, group: 15, category: 'metalloid', block: 'p', electronConfig: '[Kr]4d¹⁰5s²5p³', oxidationStates: '-3, +3, +5' },
  { z: 52, symbol: 'Te', nameRu: 'Теллур', mass: 127.6, period: 5, group: 16, category: 'metalloid', block: 'p', electronConfig: '[Kr]4d¹⁰5s²5p⁴', oxidationStates: '-2, +4, +6' },
  { z: 53, symbol: 'I', nameRu: 'Йод', mass: 126.9, period: 5, group: 17, category: 'halogen', block: 'p', electronConfig: '[Kr]4d¹⁰5s²5p⁵', oxidationStates: '-1, +1, +5, +7', electronegativity: 2.66, entRelevance: 'Качественная реакция на крахмал, йодная настойка' },
  { z: 54, symbol: 'Xe', nameRu: 'Ксенон', mass: 131.3, period: 5, group: 18, category: 'noble-gas', block: 'p', electronConfig: '[Kr]4d¹⁰5s²5p⁶', oxidationStates: '0, +2, +4' },

  // Period 6
  { z: 55, symbol: 'Cs', nameRu: 'Цезий', mass: 132.9, period: 6, group: 1, category: 'alkali-metal', block: 's', electronConfig: '[Xe]6s¹', oxidationStates: '+1' },
  { z: 56, symbol: 'Ba', nameRu: 'Барий', mass: 137.3, period: 6, group: 2, category: 'alkaline-earth', block: 's', electronConfig: '[Xe]6s²', oxidationStates: '+2', electronegativity: 0.89, entRelevance: 'BaSO₄ — нерастворимый, качественная реакция на SO₄²⁻' },

  // Lanthanides (57-71)
  { z: 57, symbol: 'La', nameRu: 'Лантан', mass: 138.9, period: 6, group: 3, category: 'lanthanide', block: 'f', electronConfig: '[Xe]5d¹6s²', oxidationStates: '+3' },
  { z: 58, symbol: 'Ce', nameRu: 'Церий', mass: 140.1, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3, +4' },
  { z: 59, symbol: 'Pr', nameRu: 'Празеодим', mass: 140.9, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },
  { z: 60, symbol: 'Nd', nameRu: 'Неодим', mass: 144.2, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },
  { z: 61, symbol: 'Pm', nameRu: 'Прометий', mass: 145, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },
  { z: 62, symbol: 'Sm', nameRu: 'Самарий', mass: 150.4, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+2, +3' },
  { z: 63, symbol: 'Eu', nameRu: 'Европий', mass: 152.0, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+2, +3' },
  { z: 64, symbol: 'Gd', nameRu: 'Гадолиний', mass: 157.3, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },
  { z: 65, symbol: 'Tb', nameRu: 'Тербий', mass: 158.9, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },
  { z: 66, symbol: 'Dy', nameRu: 'Диспрозий', mass: 162.5, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },
  { z: 67, symbol: 'Ho', nameRu: 'Гольмий', mass: 164.9, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },
  { z: 68, symbol: 'Er', nameRu: 'Эрбий', mass: 167.3, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },
  { z: 69, symbol: 'Tm', nameRu: 'Тулий', mass: 168.9, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },
  { z: 70, symbol: 'Yb', nameRu: 'Иттербий', mass: 173.0, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+2, +3' },
  { z: 71, symbol: 'Lu', nameRu: 'Лютеций', mass: 175.0, period: 6, group: 3, category: 'lanthanide', block: 'f', oxidationStates: '+3' },

  // Period 6 continues
  { z: 72, symbol: 'Hf', nameRu: 'Гафний', mass: 178.5, period: 6, group: 4, category: 'transition-metal', block: 'd', oxidationStates: '+4' },
  { z: 73, symbol: 'Ta', nameRu: 'Тантал', mass: 180.9, period: 6, group: 5, category: 'transition-metal', block: 'd', oxidationStates: '+5' },
  { z: 74, symbol: 'W', nameRu: 'Вольфрам', mass: 183.8, period: 6, group: 6, category: 'transition-metal', block: 'd', oxidationStates: '+4, +6' },
  { z: 75, symbol: 'Re', nameRu: 'Рений', mass: 186.2, period: 6, group: 7, category: 'transition-metal', block: 'd', oxidationStates: '+4, +7' },
  { z: 76, symbol: 'Os', nameRu: 'Осмий', mass: 190.2, period: 6, group: 8, category: 'transition-metal', block: 'd', oxidationStates: '+4, +8' },
  { z: 77, symbol: 'Ir', nameRu: 'Иридий', mass: 192.2, period: 6, group: 9, category: 'transition-metal', block: 'd', oxidationStates: '+3, +4' },
  { z: 78, symbol: 'Pt', nameRu: 'Платина', mass: 195.1, period: 6, group: 10, category: 'transition-metal', block: 'd', oxidationStates: '+2, +4' },
  { z: 79, symbol: 'Au', nameRu: 'Золото', mass: 197.0, period: 6, group: 11, category: 'transition-metal', block: 'd', electronConfig: '[Xe]4f¹⁴5d¹⁰6s¹', oxidationStates: '+1, +3', entRelevance: 'Благородный металл, царская водка' },
  { z: 80, symbol: 'Hg', nameRu: 'Ртуть', mass: 200.6, period: 6, group: 12, category: 'transition-metal', block: 'd', oxidationStates: '+1, +2', entRelevance: 'Жидкий металл, токсичность' },
  { z: 81, symbol: 'Tl', nameRu: 'Таллий', mass: 204.4, period: 6, group: 13, category: 'post-transition', block: 'p', oxidationStates: '+1, +3' },
  { z: 82, symbol: 'Pb', nameRu: 'Свинец', mass: 207.2, period: 6, group: 14, category: 'post-transition', block: 'p', oxidationStates: '+2, +4', entRelevance: 'Качественная реакция PbS — чёрный осадок' },
  { z: 83, symbol: 'Bi', nameRu: 'Висмут', mass: 209.0, period: 6, group: 15, category: 'post-transition', block: 'p', oxidationStates: '+3, +5' },
  { z: 84, symbol: 'Po', nameRu: 'Полоний', mass: 209, period: 6, group: 16, category: 'metalloid', block: 'p', oxidationStates: '+2, +4' },
  { z: 85, symbol: 'At', nameRu: 'Астат', mass: 210, period: 6, group: 17, category: 'halogen', block: 'p', oxidationStates: '-1, +1' },
  { z: 86, symbol: 'Rn', nameRu: 'Радон', mass: 222, period: 6, group: 18, category: 'noble-gas', block: 'p', oxidationStates: '0' },

  // Period 7
  { z: 87, symbol: 'Fr', nameRu: 'Франций', mass: 223, period: 7, group: 1, category: 'alkali-metal', block: 's', oxidationStates: '+1' },
  { z: 88, symbol: 'Ra', nameRu: 'Радий', mass: 226, period: 7, group: 2, category: 'alkaline-earth', block: 's', oxidationStates: '+2' },

  // Actinides (89-103)
  { z: 89, symbol: 'Ac', nameRu: 'Актиний', mass: 227, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3' },
  { z: 90, symbol: 'Th', nameRu: 'Торий', mass: 232.0, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+4' },
  { z: 91, symbol: 'Pa', nameRu: 'Протактиний', mass: 231.0, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+4, +5' },
  { z: 92, symbol: 'U', nameRu: 'Уран', mass: 238.0, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3, +4, +6' },
  { z: 93, symbol: 'Np', nameRu: 'Нептуний', mass: 237, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3 to +7' },
  { z: 94, symbol: 'Pu', nameRu: 'Плутоний', mass: 244, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3 to +7' },
  { z: 95, symbol: 'Am', nameRu: 'Америций', mass: 243, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3' },
  { z: 96, symbol: 'Cm', nameRu: 'Кюрий', mass: 247, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3' },
  { z: 97, symbol: 'Bk', nameRu: 'Берклий', mass: 247, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3' },
  { z: 98, symbol: 'Cf', nameRu: 'Калифорний', mass: 251, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3' },
  { z: 99, symbol: 'Es', nameRu: 'Эйнштейний', mass: 252, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3' },
  { z: 100, symbol: 'Fm', nameRu: 'Фермий', mass: 257, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3' },
  { z: 101, symbol: 'Md', nameRu: 'Менделевий', mass: 258, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+2, +3' },
  { z: 102, symbol: 'No', nameRu: 'Нобелий', mass: 259, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+2, +3' },
  { z: 103, symbol: 'Lr', nameRu: 'Лоуренсий', mass: 266, period: 7, group: 3, category: 'actinide', block: 'f', oxidationStates: '+3' },

  // Period 7 continues
  { z: 104, symbol: 'Rf', nameRu: 'Резерфордий', mass: 267, period: 7, group: 4, category: 'transition-metal', block: 'd', oxidationStates: '+4' },
  { z: 105, symbol: 'Db', nameRu: 'Дубний', mass: 268, period: 7, group: 5, category: 'transition-metal', block: 'd', oxidationStates: '+5' },
  { z: 106, symbol: 'Sg', nameRu: 'Сиборгий', mass: 269, period: 7, group: 6, category: 'transition-metal', block: 'd', oxidationStates: '+6' },
  { z: 107, symbol: 'Bh', nameRu: 'Борий', mass: 270, period: 7, group: 7, category: 'transition-metal', block: 'd', oxidationStates: '+7' },
  { z: 108, symbol: 'Hs', nameRu: 'Хассий', mass: 277, period: 7, group: 8, category: 'transition-metal', block: 'd', oxidationStates: '+8' },
  { z: 109, symbol: 'Mt', nameRu: 'Мейтнерий', mass: 278, period: 7, group: 9, category: 'transition-metal', block: 'd', oxidationStates: '' },
  { z: 110, symbol: 'Ds', nameRu: 'Дармштадтий', mass: 281, period: 7, group: 10, category: 'transition-metal', block: 'd', oxidationStates: '' },
  { z: 111, symbol: 'Rg', nameRu: 'Рентгений', mass: 282, period: 7, group: 11, category: 'transition-metal', block: 'd', oxidationStates: '' },
  { z: 112, symbol: 'Cn', nameRu: 'Коперниций', mass: 285, period: 7, group: 12, category: 'transition-metal', block: 'd', oxidationStates: '+2' },
  { z: 113, symbol: 'Nh', nameRu: 'Нихоний', mass: 286, period: 7, group: 13, category: 'post-transition', block: 'p', oxidationStates: '' },
  { z: 114, symbol: 'Fl', nameRu: 'Флеровий', mass: 289, period: 7, group: 14, category: 'post-transition', block: 'p', oxidationStates: '' },
  { z: 115, symbol: 'Mc', nameRu: 'Московий', mass: 290, period: 7, group: 15, category: 'post-transition', block: 'p', oxidationStates: '' },
  { z: 116, symbol: 'Lv', nameRu: 'Ливерморий', mass: 293, period: 7, group: 16, category: 'post-transition', block: 'p', oxidationStates: '' },
  { z: 117, symbol: 'Ts', nameRu: 'Теннессин', mass: 294, period: 7, group: 17, category: 'halogen', block: 'p', oxidationStates: '' },
  { z: 118, symbol: 'Og', nameRu: 'Оганесон', mass: 294, period: 7, group: 18, category: 'noble-gas', block: 'p', oxidationStates: '' },
]
