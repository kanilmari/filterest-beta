# Technical Definitions & Rules

Tämä tiedosto määrittelee tekniset säännöt ja periaatteet, joita Visual AI Guardian valvoo. **Tarkat arvot haetaan aina lähdetiedostoista** – tämä dokumentti kertoo vain *missä* ja *miksi*.

> **Agenteille:** Älä kopioi arvoja tähän tiedostoon. Viittaa aina lähdetiedostoihin.
>
> **Suositeltu malli:** pidä tarkat arvot selkeästi kommentoiduissa konfiguraatioissa ja lähdetiedostoissa. Tekstidokumentaation tehtävä on kertoa, mitä valvotaan, miksi se on tärkeää, ja mistä kanoninen lähde löytyy.

## 1. Visuaalinen identiteetti (Visual Identity)

### Väripaletti (Color Palette)
**Lähde:** [frontend/styles/variables.css](../../../frontend/styles/variables.css)

Värit johdetaan `--brand-hue` -muuttujasta HSL-funktioilla. Katso tarkat arvot lähdetiedostosta.

### Typografia (Typography)
**Lähde:** [frontend/styles/base.css](../../../frontend/styles/base.css)

Fontti, koko, riviväli ja kirjainväli määritellään `body`-säännössä.

### Spacing & Layout
**Lähteet:**
- [frontend/styles/variables.css](../../../frontend/styles/variables.css) – CSS-muuttujat
- [frontend/styles/framework.css](../../../frontend/styles/framework.css) – Yhteiset layout-utilityt ja UI-primitivit
- [frontend/core_components/filterbar/filterbar_layout.css](../../../frontend/core_components/filterbar/filterbar_layout.css) – Filtteripalkin hero/sidebar/search-only-layout

Perusyksikkö, navbar-leveys, container-maksimileveys ja border-radius löytyvät näistä tiedostoista.

## 2. Responsiivisuus (Responsiveness)

### Breakpoints
**Lähteet:**
- [frontend/styles/mobile_friendliness.css](../../../frontend/styles/mobile_friendliness.css) – Media queries
- [frontend/ui_config.js](../../../frontend/ui_config.js) – JS-vakiot (esim. `NAVBAR_WIDTH_THRESHOLD`)

### Navigaation käyttäytyminen (Navigation Behavior)
- **Desktop & Laptop**: Kiinteä sivupalkki (Sidebar).
    - **Toggle-nappi**: Aina näkyvissä. Ei saa pyöriä. Kuvastaa oikealla olevaa sivupalkkia.
    - **Koko & Muoto**: Toggle-napin ja Menu-napin oltava samankokoiset ja yhtä etäällä kulmista.
    - **Tila (Desktop, leveä näyttö)**: Vie tilaa sisällöltä.
    - **Tila (Laptop, kapeampi näyttö)**: Overlay (kelluu päällä).
- **Mobile**: `position: fixed`, varjostus vasemmalla.
    - **Leveys**: Käytettävä tehokkaasti, ei kiinteää %-sääntöä.
- **Menu-nappi (Hamburger)**:
    - **Z-Index Hierarkia**: Menu-napin on oltava **aina** käyttöliittymän ylin elementti. Se ei saa jäädä filtteripalkin tai muiden overlay-elementtien alle.
    - **Visuaalinen pari**: Menu-napin ja Sivupalkin toggle-napin tulee olla visuaalisesti yhtenäiset (sama koko, sama backdrop-blur -efekti).

### Hakupalkki (Search Bar)
- **Sijainti (Flat/Top)**: Keskitetty **sisältöalueen** (tab content) suhteen.
    - **Desktop (Navbar vie tilaa)**: Keskitetty jäljelle jäävään tilaan (viewport - navbar).
    - **Mobile/Tablet (Navbar overlay/piilossa)**: Keskitetty koko viewporttiin (viewport width).
    - **Huomio**: Hakupalkki ei saa liikkua sivusuunnassa valikon avautuessa, jos valikko on overlay-tilassa.
- **Näkyvyys**: Hakukentän tulee näkyä kokonaan, mukaan lukien varjostukset ja reunat (ei saa leikkautua).

## 3. Komponenttien säännöt (Component Rules)

### Hero / Filter Area
**Lähde:** [frontend/styles/variables.css](../../../frontend/styles/variables.css) – Z-index muuttujat

- **Behavior**: Muuttuu kiinteäksi (fixed) oikeaan reunaan kapeilla näytöillä (katso breakpoints).
- **Content Visibility**: Suodattimet eivät saa peittää varsinaista sisältöä liiaksi.
- **Filter Bar Modes (Tilat)**:
    - **Hero Mode**: Laaja näkymä, saa olla skrollattava jos sisältö ei mahdu.
    - **Flat Mode (Litteä tila)**: Kun palkki on tiivistynyt ylös, se toimii kiinteänä yläpalkkina.
        - **Scrollaus**: **EHDOTTOMASTI KIELLETTY**. Palkin sisällä oleva sisältö ei saa liikkua pystysuunnassa.
        - **Overflow**: Tulee sallia (`overflow: visible`) tai hallita niin, että varjostukset ja focus-efektit eivät leikkaudu.

### Lataustilat (Loading States)
- **Layout Shift**: CLS (Cumulative Layout Shift) oltava `0`. Tila on varattava etukäteen.

## 4. Saavutettavuus (Accessibility)

### Kontrasti (Contrast)
- **Standardi**: WCAG 2.1 AA (minimi).
- **Teksti**: Suhde vähintään 4.5:1.
- **Isot tekstit**: Suhde vähintään 3:1.

### Interaktioalueet (Touch Targets)
- **Minimikoko**: 44x44px (mobiili).

---

## Lähdetiedostot yhteenveto

| Aihe | Lähdetiedosto |
|------|---------------|
| CSS-muuttujat | [frontend/styles/variables.css](../../../frontend/styles/variables.css) |
| Typografia | [frontend/styles/base.css](../../../frontend/styles/base.css) |
| Layout | [frontend/styles/framework.css](../../../frontend/styles/framework.css), [frontend/core_components/filterbar/filterbar_layout.css](../../../frontend/core_components/filterbar/filterbar_layout.css) |
| Responsiivisuus | [frontend/styles/mobile_friendliness.css](../../../frontend/styles/mobile_friendliness.css) |
| JS-vakiot | [frontend/ui_config.js](../../../frontend/ui_config.js) |
