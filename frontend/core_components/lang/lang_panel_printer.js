// lang_panel_printer.js
// Renders the language selection panel and wires user interactions to the translation system.
// Bridges lang_preference_reader and translation_handler with the DOM language-menu UI.
// Exists to keep language-panel rendering isolated from the broader navigation and translation logic.
import { translatePage } from './translation_handler.js';
import {
  getPreferredAvailableLanguage,
  setLanguage,
} from '../state_stores/lang_preference_reader.js';
import { createMaskIconSpan } from '../../icons/icon_mask_builder.js';

const menu_language_icon_path = '/frontend/icons/navigation/language-globe-icon.svg';

function ensureMenuLanguageIcon(buttonElement) {
  if (!buttonElement) return null;

  let iconElement = buttonElement.querySelector('.language-button-icon');
  if (iconElement) {
    return iconElement;
  }

  iconElement = createMaskIconSpan(menu_language_icon_path, ['language-button-icon']);
  buttonElement.prepend(iconElement);
  return iconElement;
}

function ensureMenuLanguageLabel(buttonElement) {
  if (!buttonElement) return null;

  let labelElement = buttonElement.querySelector('.language-code-label');
  if (labelElement) {
    return labelElement;
  }

  labelElement = document.createElement('span');
  labelElement.className = 'language-code-label';
  buttonElement.appendChild(labelElement);
  return labelElement;
}

function syncMenuLanguageButton(buttonElement, languageCode) {
  if (!buttonElement) return;

  ensureMenuLanguageIcon(buttonElement);
  const labelElement = ensureMenuLanguageLabel(buttonElement);
  labelElement.textContent = getShortLanguageCode(languageCode) || 'EN';
}

// Määritellään kielivaihtoehdot
const languages = [
  { id: 'lang-en', value: 'en', label: 'English (US)', title: 'Show menus in English' },
  { id: 'lang-fi', value: 'fi', label: 'Finnish (Suomi)', title: 'Show menus in Finnish' },
  { id: 'lang-yue', value: 'yue', label: 'Cantonese (廣東話)', title: '以廣東話顯示選單' },
//   { id: 'lang-sv', value: 'sv', label: 'Swedish (Svenska)', title: 'Show menus in Swedish' },
//   { id: 'lang-ch', value: 'ch', label: 'Chinese (中文)', title: 'Show menus in Chinese' },
];
const menuLanguageValues = languages.map((lang) => lang.value);

document.addEventListener('DOMContentLoaded', function() {
  const languageSelectorDiv = document.querySelector('.language-selection.menu-language-selection');
  if (!languageSelectorDiv) {
    console.warn('kielenvalitsimen elementtiä ei löytynyt.');
    return;
  }

  // Luodaan kielivalitsin-nappi:
  let languageButton = document.createElement('button');
  languageButton.classList.add('language-button');
  languageButton.classList.add('button');
  languageButton.dataset.testid = 'language-menu-button';

  // Liitetään nappi valikkoon
  languageSelectorDiv.appendChild(languageButton);

  // Luodaan kelluva paneeli
  let floatingPanel = document.createElement('div');
  floatingPanel.classList.add('floating-language-panel', 'hidden');
  floatingPanel.dataset.testid = 'language-menu-panel';
  
  // Rakennetaan paneelin sisältö turvallisesti:
  let panelContent = document.createElement('div');
  panelContent.classList.add('panel-content');

  // "Valitse kieli" -otsikko
  {
    let labelElement = document.createElement('label');
    let boldElement = document.createElement('b');
    // boldElement.textContent = 'Valitse kieli';
    // add attribute data-lang-key
    labelElement.dataset.langKey = 'select_menu_language';
    labelElement.appendChild(boldElement);
    panelContent.appendChild(labelElement);
  }

  // Kielioptiot
  languages.forEach(lang => {
    let languageOptionDiv = document.createElement('div');
    languageOptionDiv.classList.add('language-option');

    let inputElement = document.createElement('input');
    inputElement.id = lang.id;
    inputElement.type = 'radio';
    inputElement.name = 'menu-lang';
    inputElement.value = lang.value;
    inputElement.title = lang.title;
    inputElement.dataset.testid = `language-menu-option-${lang.value}`;

    let labelLang = document.createElement('label');
    labelLang.setAttribute('for', lang.id);
    labelLang.textContent = lang.label;

    languageOptionDiv.appendChild(inputElement);
    languageOptionDiv.appendChild(labelLang);
    panelContent.appendChild(languageOptionDiv);
  });

  // Lisätään paneelin sisältö paneliin ja liitetään se kielivalitsimen sisään
  floatingPanel.appendChild(panelContent);
  languageSelectorDiv.appendChild(floatingPanel);
  languageSelectorDiv.style.position = 'relative';

  // Haetaan juuri lisätyt elementit
  const radioInputs = floatingPanel.querySelectorAll('input[name="menu-lang"]');

  // Napin klikkaus avaa/sulkee paneelin
  languageButton.addEventListener('click', function() {
    toggleLanguagePanel();
  });

  // Radioille tapahtumankuuntelijat: kieli vaihtuu -> tallennus, sivun käännös, paneelin sulku
  radioInputs.forEach(function(radio) {
    radio.addEventListener('change', function() {
      setLanguage(radio.value);
      void updateMenuLanguageDisplay(radio.value);
      translatePage(radio.value);
      floatingPanel.classList.add('hidden');
    });
  });

  // Asetetaan oletuskieli
  const initialLanguage = setDefaultMenuLanguage();
  void updateMenuLanguageDisplay(initialLanguage);

  // Käännetään sivu tallennetulla kielellä
  translatePage(initialLanguage);

  // Suljetaan paneeli klikatessa ulkopuolelle
  document.addEventListener('click', function(event) {
    if (!languageSelectorDiv.contains(event.target) && !floatingPanel.contains(event.target)) {
      if (!floatingPanel.classList.contains('hidden')) {
        floatingPanel.classList.add('hidden');
      }
    }
  });

  // Tämä funktio näyttää/piilottaa paneelin, 
  // ja asettaa sen sijainnin napin alle.
  function toggleLanguagePanel() {
    // Suljetaan muut vastaavat paneelit (jos on)
    document.querySelectorAll('.floating-language-panel').forEach((panel) => {
      if (panel !== floatingPanel) {
        panel.classList.add('hidden');
      }
    });
    // Sijainnin laskenta
    positionPanelBelowButton();
    floatingPanel.classList.toggle('hidden');
  }

  // Sijoitetaan paneeli napin alapuolelle
  function positionPanelBelowButton() {
    floatingPanel.style.minWidth = `${Math.max(languageButton.offsetWidth + 132, 220)}px`;
  }
});

// Asetetaan oletuskieli localStoragen tai selaimen mukaan
function setDefaultMenuLanguage() {
  const savedLang = getPreferredAvailableLanguage(menuLanguageValues);
  let matchingRadio = document.querySelector(
    `.floating-language-panel input[value="${savedLang}"]`
  ) || document.querySelector('.floating-language-panel input[value="en"]')
    || document.querySelector('.floating-language-panel input[name="menu-lang"]');
  if (matchingRadio) {
    matchingRadio.checked = true;
    return matchingRadio.value;
  }
  return savedLang;
}

// Päivittää valitun kielen tekstin buttoniin
export async function updateMenuLanguageDisplay(nextLanguage = null) {
  let chosen_language = nextLanguage
    || document.querySelector('.floating-language-panel input[type="radio"]:checked')?.value
    || getPreferredAvailableLanguage(menuLanguageValues);
  let buttonElement = document.querySelector('.language-selection .language-button');
  if (buttonElement) {
    syncMenuLanguageButton(buttonElement, chosen_language);
  }
}

// Palauttaa lyhyen koodin, esim. 'EN'
function getShortLanguageCode(languageCode) {
  const shortCodes = {
    'en': 'EN',
    'fi': 'FI',
    'sv': 'SV',
    'ch': 'CH',
    'yue': '粵'
  };
  return shortCodes[languageCode] || languageCode;
}
