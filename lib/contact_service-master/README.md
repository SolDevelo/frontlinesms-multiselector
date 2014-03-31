#ContactService.js spec v1
You can assume a contactService variable will be available in the global scope, initialised before your function. It contains the following methods:
- getAll() : returns all 'objects'
- getAllMatches(searchString) : returns all objects that match the searchString
- getFilteredMatches(selectedIds, searchString) : returns all objects that match the searchString, but excludes any in the selectedIds list
- getFilteredMatches(selectedIds) : returns all objects, but excludes any in the selectedIds list.

All four methods will return a list of 'grouping' objects.

A *grouping* object has:
- a *displayName*, which is displayed to the user as the heading when listing entries of this grouping
- a *customCssClass*, which should be given as a css class for each of the members when displaying them
- a list of *members*, each of which are *directoryObjects*
- an optional 'disabled' entry. If true, the element should be shown in the list, but should not be able for selection

A directoryObject has:
- a *name*, displayed to the user
- an *id*, which is a unique identifier of this object, and will form part of the 'getSelectedObjects' response in the javascript library
- a *metaData* field, which is user-facing information that should be displayed next to the name in the dropdown

Sample request:
```
contactService.getFilteredMatches("bob", "contact-3", "group-2")
```

Sample response:
```JSON
[
    {
        "displayName": "Contacts",
        "customCssClass": "contact",
        "members": [
            {
                "name": "bobby",
                "id": "contact-12",
                "metadata": "+232 728 323 425"
            },
            {
                "name": "robbob",
                "id": "contact-113",
                "metadata": "+44 7832 323 425",
                "disabled" : true
            }
        ]
    },
    {
        "displayName": "Groups",
        "customCssClass": "group",
        "members": [
            {
                "name": "bobguys",
                "id": "group-12",
                "metadata": "10 members"
            }
        ]
    }
]
```

Assumptions:
- Empty groupings will not be returned. For example, if the search string only matches one "contact", there will be no grouping object for "Groups"
