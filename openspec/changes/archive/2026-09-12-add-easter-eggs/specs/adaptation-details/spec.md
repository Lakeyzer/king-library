## ADDED Requirements

### Requirement: Misery adaptation detail page glitches the letter N
The Misery adaptation detail page SHALL render every occurrence of the letter "N" (uppercase and lowercase) within the page's own content - excluding the site header and footer - with reduced opacity, referencing Paul Sheldon's typewriter missing its N key. No other adaptation detail page SHALL show this treatment.

#### Scenario: Viewing the Misery adaptation detail page
- **WHEN** a visitor loads the Misery adaptation detail page
- **THEN** every letter "N" or "n" in the page's own content is rendered at reduced opacity relative to the surrounding text, and the site header and footer are unaffected

#### Scenario: Other adaptation detail pages are unaffected
- **WHEN** a visitor loads any adaptation detail page other than Misery
- **THEN** no letter is rendered with the reduced-opacity treatment
