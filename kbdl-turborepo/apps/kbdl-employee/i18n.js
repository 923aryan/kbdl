// i18n.js
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import translations from './translations';

const i18n = new I18n(translations);

// Set the locale from device
i18n.locale = Localization.locale;

// Fallback if translation missing
i18n.enableFallback = true;

export default i18n;