import type { ObjectType } from '../types';
import type { Language, TranslationKey } from '../i18n';
import { translations } from '../i18n';

// Map object types to translation keys
const objectTypeToKey: Record<ObjectType, TranslationKey> = {
  'single-door': 'singleDoor',
  'double-door': 'doubleDoor',
  'sliding-door': 'slidingDoor',
  'pocket-door': 'pocketDoor',
  'french-door': 'frenchDoor',
  'standard-window': 'standardWindow',
  'floor-window': 'floorWindow',
  'small-window': 'smallWindow',
  'bay-window': 'bayWindow',
  'sofa-2': 'sofa2',
  'sofa-3': 'sofa3',
  'sofa-l': 'sofaL',
  'armchair': 'armchair',
  'coffee-table': 'coffeeTable',
  'tv-stand': 'tvStand',
  'bookshelf': 'bookshelf',
  'side-table': 'sideTable',
  'floor-lamp': 'floorLamp',
  'rug-rect': 'rugRect',
  'bed-single': 'bedSingle',
  'bed-double': 'bedDouble',
  'bed-queen': 'bedQueen',
  'bed-king': 'bedKing',
  'nightstand': 'nightstand',
  'wardrobe': 'wardrobe',
  'dresser': 'dresser',
  'desk': 'desk',
  'office-chair': 'officeChair',
  'dining-table-4': 'diningTable4',
  'dining-table-6': 'diningTable6',
  'dining-table-8': 'diningTable8',
  'round-table-4': 'roundTable4',
  'dining-chair': 'diningChair',
  'bar-stool': 'barStool',
  'sideboard': 'sideboard',
  'refrigerator': 'refrigerator',
  'dishwasher': 'dishwasher',
  'washing-machine': 'washingMachine',
  'dryer': 'dryer',
  'oven': 'oven',
  'cooktop': 'cooktop',
  'microwave': 'microwave',
  'kitchen-sink': 'kitchenSink',
  'kitchen-cabinet-base': 'kitchenCabinetBase',
  'kitchen-cabinet-wall': 'kitchenCabinetWall',
  'kitchen-island': 'kitchenIsland',
  'toilet': 'toilet',
  'bathtub': 'bathtub',
  'shower-square': 'showerSquare',
  'shower-rect': 'showerRect',
  'bathroom-sink': 'bathroomSink',
  'vanity': 'vanity',
  'radiator-small': 'radiatorSmall',
  'radiator-medium': 'radiatorMedium',
  'radiator-large': 'radiatorLarge',
  'radiator-vertical': 'radiatorVertical',
  'ac-unit': 'acUnit',
  'standing-fan': 'standingFan',
  'space-heater': 'spaceHeater',
  'void': 'void',
  'column-square': 'columnSquare',
  'column-round': 'columnRound',
  'stairs-straight': 'stairsStraight',
  'stairs-l': 'stairsL',
  'stairs-spiral': 'stairsSpiral',
  'ladder': 'ladder',
};

export function getLocalizedObjectName(type: ObjectType, language: Language): string {
  const key = objectTypeToKey[type];
  if (key && translations[language][key]) {
    return translations[language][key];
  }
  // Fallback to English or type name
  return translations.en[key] || type;
}
