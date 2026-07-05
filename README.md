# Segmented Button Card

A dependency-free custom Lovelace card for Home Assistant that renders a Material Design 3 style segmented button control bound to an `input_select` helper.

## Features

- Binds directly to an `input_select` helper entity. It'll create one segment per option in the bound `input_select`
- Lets you edit the displayed text and icon for each option
- Lets you remove unwanted options from the card without having to remove them from the `input_select`
- Responsive segmented layout with selected-state styling inspired by Material Design 3
- Built-in visual Lovelace config editor for entity and segment rows

## Install

### HACS

1. Add this repository in HACS as a custom repository of type `Dashboard`.
2. Install the card from HACS.
3. HACS will install the Lovelace resource for you and serve it from `/hacsfiles/ha-segmented-button-card.js`.
4. Edit your dashboard, and add a new **Segmented Button Card**

### Manual install

1. Copy `ha-segmented-button-card.js` to a location served by Home Assistant, such as `/config/www/`.
2. Add the resource in Lovelace:

```yaml
resources:
  - url: /local/ha-segmented-button-card.js
    type: module
```

3. Reload the dashboard and add a new **Segmented Button Card**


## Screenshots

### Config Editor

<img src="https://raw.githubusercontent.com/displaced/ha-segmented-button-card/main/docs/images/config-editor.png" alt="Segmented Button Card configuration editor" width="720" />

### Dashboard Card

<img src="https://raw.githubusercontent.com/displaced/ha-segmented-button-card/main/docs/images/card.png" alt="Segmented Button Card on a Home Assistant dashboard" width="720" />

## Example

```yaml
type: custom:ha-segmented-button-card
entity: input_select.climate_mode
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
