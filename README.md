# HA Segmented Button Card

A dependency-free custom Lovelace card for Home Assistant that renders a Material Design 3 style segmented button control bound to an `input_select` helper.

## Features

- Binds directly to an `input_select` entity
- Supports custom text and icon per segment
- Automatically creates one row per option in the selected `input_select`
- Lets you edit the displayed text and icon for each option
- Lets you remove unwanted options from the card
- Optional header for the whole control
- Responsive segmented layout with selected-state styling inspired by Material Design 3
- Built-in visual Lovelace config editor for entity, header, and segment rows

## Install

### HACS

1. Add this repository in HACS as a custom repository of type `Dashboard`.
2. Install the card from HACS.
3. HACS will install the Lovelace resource for you and serve it from `/hacsfiles/ha-segmented-button-card.js`.
4. Reload the dashboard and add a card with `type: custom:ha-segmented-button-card`.

The card includes a built-in visual editor, so you can configure it directly from the Lovelace UI after HACS installs it.

### Manual install

1. Copy `ha-segmented-button-card.js` to a location served by Home Assistant, such as `/config/www/`.
2. Add the resource in Lovelace:

```yaml
resources:
  - url: /local/ha-segmented-button-card.js
    type: module
```

3. Reload the dashboard and add a card with `type: custom:ha-segmented-button-card`.

## Example

```yaml
type: custom:ha-segmented-button-card
entity: input_select.climate_mode
header: Climate Mode
segments:
  - value: Off
    text: Off
    icon: mdi:power
  - value: Heat
    text: Heat
    icon: mdi:fire
  - value: Cool
    text: Cool
    icon: mdi:snowflake
```

## Segment Config

Rows are generated from the selected `input_select` helper. You can then edit the text and icon for each option, and remove any rows you do not want shown.

```yaml
segments:
  - value: Off
    text: Off
    icon: mdi:power
  - value: Heat
    text: Heating
    icon: mdi:fire
```

If `segments` is omitted in YAML, the editor will populate them from the selected helper on first open.