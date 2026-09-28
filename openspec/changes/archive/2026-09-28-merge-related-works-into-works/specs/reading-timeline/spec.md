## MODIFIED Requirements

### Requirement: Owner can delete a logged read from its edit prompt
The system SHALL let the signed-in owner of a logged read permanently delete that entry from a Delete control in the footer of its edit prompt (the same prompt opened via the entry's date-editing control), after confirming. Confirming means activating the same control a second time within a short window, rather than a separate confirmation dialog. Deleting a logged read removes only that one entry, whether the work is a King work or a By Other Hands work, and leaves any other logged reads for the same work untouched. If the deleted entry was the work's most-recently-read one, the work's summary (its most recent start/finish date, shown elsewhere in the app) SHALL update to the next-most-recent remaining read, or revert to unread if none remain. The system SHALL NOT show this control to anyone other than the entry's owner.

#### Scenario: Deleting a King work's only logged read
- **WHEN** the owner deletes a King work's only logged read
- **THEN** that entry no longer appears on the Reading Timeline, and the work reverts to unread

#### Scenario: Deleting one of several logged reads for the same King work
- **WHEN** the owner deletes one of several logged reads for the same King work
- **THEN** only that entry is removed, the work's other logged reads remain, and the work stays marked read

#### Scenario: Deleting the most recent of several logged reads updates the summary
- **WHEN** the owner deletes a King work's most-recently-read logged read, and other logged reads remain for that work
- **THEN** the work's summary reflects whichever remaining logged read is now most recent

#### Scenario: Deleting a By Other Hands entry
- **WHEN** the owner deletes a By Other Hands work's only logged read
- **THEN** that entry no longer appears on the Reading Timeline, and the work reverts to unread

#### Scenario: Deleting one of several logged reads for the same By Other Hands work
- **WHEN** the owner deletes one of several logged reads for the same By Other Hands work
- **THEN** only that entry is removed, the work's other logged reads remain, and the work stays marked read

#### Scenario: Confirming a delete
- **WHEN** the owner activates Delete once, then activates it again within the confirmation window
- **THEN** the entry is deleted

#### Scenario: Not confirming a delete
- **WHEN** the owner activates Delete once and does not activate it again before the confirmation window elapses
- **THEN** the entry is not deleted, and a further activation is treated as a fresh first click

### Requirement: Reading Timeline includes Works by Others reads
The system SHALL include, alongside King works, every logged read of a Works by Others work by the page's owner, one entry per logged read, ordered together with King reads by the same most-recent-first rule. The system SHALL let the owner edit a Works by Others entry's dates, note, rating, and format the same as a King entry. A Works by Others entry SHALL NOT appear here for a work only marked read because an omnibus cascaded onto it (see the by-other-hands capability). Only a read logged on the work itself appears.

#### Scenario: A Works by Others read appears on the timeline
- **WHEN** the page's owner has read a Works by Others work
- **THEN** the Reading Timeline page shows an entry for that read, ordered alongside King reads by date

#### Scenario: A reread Works by Others work shows one entry per read
- **WHEN** the page's owner has logged two reads of the same Works by Others work
- **THEN** the Reading Timeline page shows two separate entries for that work, one per read

#### Scenario: Owner can edit a Works by Others entry
- **WHEN** the page's owner activates the edit-dates control on a Works by Others entry
- **THEN** they can update that read's dates, note, rating, and format, the same as they can for a King entry

#### Scenario: A cascaded omnibus component is not shown separately
- **WHEN** the page's owner marks a Works by Others omnibus read, cascading read status onto the individual works it collects
- **THEN** only the omnibus itself appears as a Reading Timeline entry, not the works it collects
