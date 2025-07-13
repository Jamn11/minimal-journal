<overview>
This is a minimalist, highly functional and usable journal app.
The basic functionality is simply creating, viewing, and searching journal entries.
</overview>

<tech_stack>
The app is written in electron and intended to run on MacOS.

All user data should be stored in a local databse which should be stored by the app on device. An entry object would have the following elements:
– id (UUID)
– title (string)
– body (string)
– timestamp (ISO string)
– tags (string[])
– draft (boolean)
</tech_stack>

<design_details>
The app should have a minimalist aesthetic. It has dark mode and light mode and all text is rendered in courier-new (similar fonts are acceptable if this font is not available). 

The app is made up of three main screens: the Journal Screen, the Home Screen, and the View Screen.

The Journal Screen is where the user can actually write entries. It is simply composed of a title text box, an entry text box, and a save button. The title text box and save button are fairly small and inline horizontally with one another above the entry text box. The save button will save the entry (title and main body) as well as automatically attaching a timestamp (year, month, day, and time) for the time when the user pressed the save button. Pressing the save button takes the user to the home screen, where they will be able to see the new entry. The user can also exit by pressing the escape key, which brings them back to the homescreen with the entry saved as a draft. Drafts can be edited. Clicking on a draft in the homescreen brings the user back to the Journal Screen where they can edit their draft more. There is a word counter at the bottom right of the screen which shows how many words are in the main entry text box at any given moment. When the entry is saved, the app should parse the entry for any # symbols with no spaces after them and save these as tags. For instance, if an entry contains #health, the entry should have the "health" tag. Tags with punctuation are allowed and tags are case sensitive.

The Home Screen is simply a search bar and filter button in line with one another above a scrollable list of all of the user's entries. The user can search and filter by title, timestamp, or tag. Clicking on an entry in the scrollable list brings the user to the View Screen where they can read an entry. The user can get from the Home Screen to the Journal Screen for a new entry by pressing CMD + n. There is no button for making a new entry.

The view screen simply contains a stylized and readable rendering of the entry's title and text. 

Please reference the design notes image in this document which contains sketches and details about the design.
</design_details>

<keyboard_shortcuts>
– CMD+N: open blank Journal Screen from the Home Screen
– ESC: exit to Home Screen from Journal Screen(auto-save draft)
– CMD+F: focus search bar in Home Screen
- CMD+S: Save draft in Journal Screen
</keyboard_shortcuts>