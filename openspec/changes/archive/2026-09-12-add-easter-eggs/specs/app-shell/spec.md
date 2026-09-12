## MODIFIED Requirements

### Requirement: Header provides a color mode toggle
The system SHALL render a control on the trailing side of the header that lets a visitor switch between light and dark color modes. The control SHALL expose the hover/tooltip text "That spells dark mode" (Tom Cullen's M-O-O-N bit from *The Stand*).

#### Scenario: Toggling color mode
- **WHEN** a visitor activates the color mode control in the header
- **THEN** the app's color mode switches accordingly

#### Scenario: Hovering the color mode control
- **WHEN** a visitor hovers the color mode control in the header
- **THEN** a tooltip reading "That spells dark mode" is shown
