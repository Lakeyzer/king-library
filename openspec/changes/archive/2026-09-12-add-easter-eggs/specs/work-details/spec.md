## ADDED Requirements

### Requirement: Charlie the Choo-Choo detail page's author loops between two forms, with an animated transition
The Charlie the Choo-Choo work detail page SHALL display an author byline reading "Beryl Evans" on load. While the page remains open, the byline SHALL alternate indefinitely between "Beryl Evans" and "Claudia y Inez Bachman" at a regular interval, referencing the *Wolves of the Calla* book-within-a-book gag. Each change from one name to the other SHALL use a visible animated transition (e.g. a letter-scramble effect) rather than swapping instantly. No other work detail page SHALL show this behavior.

#### Scenario: Loading the Charlie the Choo-Choo detail page
- **WHEN** a visitor loads the Charlie the Choo-Choo work detail page
- **THEN** the author byline initially reads "Beryl Evans"

#### Scenario: Byline animates to the alternate name after a delay
- **WHEN** a visitor has had the Charlie the Choo-Choo work detail page open for the loop's interval
- **THEN** the author byline animates from its current name to the other one, ending on the full alternate name

#### Scenario: Byline keeps alternating indefinitely
- **WHEN** a visitor keeps the Charlie the Choo-Choo work detail page open across multiple intervals
- **THEN** the author byline keeps alternating between "Beryl Evans" and "Claudia y Inez Bachman" for as long as the page stays open, rather than settling permanently on either name

#### Scenario: Other work detail pages are unaffected
- **WHEN** a visitor loads any work detail page other than Charlie the Choo-Choo
- **THEN** no author byline loop or animation occurs

### Requirement: Misery detail page glitches the letter N
The Misery work detail page SHALL render every occurrence of the letter "N" (uppercase and lowercase) within the page's own content - excluding the site header and footer - with reduced opacity, referencing Paul Sheldon's typewriter missing its N key. No other work detail page SHALL show this treatment.

#### Scenario: Viewing the Misery detail page
- **WHEN** a visitor loads the Misery work detail page
- **THEN** every letter "N" or "n" in the page's own content is rendered at reduced opacity relative to the surrounding text, and the site header and footer are unaffected

#### Scenario: Other work detail pages are unaffected
- **WHEN** a visitor loads any work detail page other than Misery
- **THEN** no letter is rendered with the reduced-opacity treatment
