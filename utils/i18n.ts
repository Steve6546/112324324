// Internationalization / Localization utilities
// Arabic text constants to avoid encoding issues

export const ARABIC_TEXT = {
  // Voice commands
  CREATE_PROJECT: 'أنشئ',
  MAKE_PROJECT: 'اصنع',
  BUILD_PROJECT: 'بنِ',
  NEW_PROJECT: 'مشروع جديد',
  START_PROJECT: 'ابدأ مشروع',
  OPEN_PROJECT: 'افتح',
  SHOW_PROJECT: 'اظهر',
  LOAD_PROJECT: 'حمّل',
  DELETE_PROJECT: 'احذف',
  REMOVE_PROJECT: 'أزل',
  ERASE_PROJECT: 'امسح',
  CLEAR_TEXT: 'امسح',
  SUBMIT_TEXT: 'أرسل',

  // UI Labels
  CREATE_NEW_FILE: 'إنشاء ملف جديد',
  FILE_NAME: 'اسم الملف',
  FILE_NAME_EXAMPLE: 'مثال: page2.html, styles.css, script.js',

  // Voice profile corrections
  CORRECTIONS: {
    'كرييت': 'create',
    'ميك': 'make',
    'صابميت': 'submit',
    'كلير': 'clear',
    'بيلد': 'build',
    'ستارت': 'start',
    'ستوب': 'stop',
    'أنشئ': 'create',
    'اصنع': 'make',
    'أرسل': 'submit',
    'امسح': 'clear'
  },

  // Wake words
  WAKE_WORDS: ['hey lovable', 'لوفابل'],

  // Commands descriptions
  COMMAND_DESCRIPTIONS: {
    CREATE_PROJECT: 'إنشاء مشروع جديد',
    OPEN_PROJECT: 'فتح مشروع',
    DELETE_PROJECT: 'حذف مشروع'
  }
} as const;

// Helper function to get Arabic text
export const getArabicText = (key: keyof typeof ARABIC_TEXT): string => {
  return ARABIC_TEXT[key] as string;
};

// Helper function to get nested Arabic text
export const getNestedArabicText = (parentKey: keyof typeof ARABIC_TEXT, childKey: string): string => {
  const parent = ARABIC_TEXT[parentKey];
  if (typeof parent === 'object' && parent !== null && childKey in parent) {
    return (parent as any)[childKey];
  }
  return '';
};