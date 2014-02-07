/*

 The MIT License (MIT)

 Copyright (c) 2014 SolDevelo

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

(function($) {
    "use strict";

    $.fn.multiselect = function(options) {
        // currently selected element === this
        // assigning it to a variable for use in inline functions
        var currentElement = this;
        var defaultOptions = {
            width: 500,
            minResultsHeight: 300,
            itemDisplayLimit: 25,
            objectAdded: null,
            objectRemoved: null
        };

        var constants = {
            groupingNames: {
                contacts: 'contacts',
                groups: 'groups',
                smartgroups: 'smartgroups'
            }
        };

        var helpers = {
            parseOptions: function(options, defaultOptions) {
                if (!options) {
                    return defaultOptions;
                }

                if (options.itemDisplayLimit === undefined) {
                    options.itemDisplayLimit = defaultOptions.itemDisplayLimit;
                }
                if (options.width === undefined) {
                    options.width = defaultOptions.width;
                }
                if (options.minResultsHeight === undefined) {
                    options.minResultsHeight = defaultOptions.minResultsHeight;
                }
                if (options.objectAdded === undefined) {
                    options.objectAdded = defaultOptions.objectAdded;
                }
                if (options.objectRemoved === undefined) {
                    options.objectRemoved = defaultOptions.objectRemoved;
                }

                return options;
            },
            getGroupingByName: function(name) {
                var grouping = null;
                if (multiSelector.results.length) {
                    for (var i = 0; i < multiSelector.results.length; i++) {
                        if (multiSelector.results[i].displayName === name) {
                            return multiSelector.results[i];
                        }
                    }
                }
                return grouping;
            },
            createGroupChildElement: function(group, child) {
                if (child === undefined || child === null) {
                    return null;
                }

                return $(document.createElement("li"))
                    .addClass("multiselector-list-item")
                    .text(child.name);
            },
            createGroupElement: function(group) {
                if (group === undefined || group === null) {
                    return null;
                }

                var groupElement = $(document.createElement("ul"));
                var groupNameElement = $(document.createElement("span")).text(group.displayName);
                var listItem = $(document.createElement("li"))
                    .append(groupNameElement)
                    .append(groupElement);

                if (group.customCssClass !== undefined) {
                    listItem.addClass(group.customCssClass);
                }

                for (var i = 0; i < group.members.length && i < multiSelector.options.itemDisplayLimit; i++) {
                    groupElement.append(helpers.createGroupChildElement(group, group.members[i]));
                }

                return listItem;
            },
            createInput: function() {
                return $(document.createElement("input"))
                    .addClass("multiselector-input")
                    .width(multiSelector.options.width);
            },
            createResultsDiv: function() {
                var ul = document.createElement("ul");

                return $(document.createElement("div"))
                    .addClass("multiselector-results")
                    .width(multiSelector.options.width)
                    .height(multiSelector.options.minResultsHeight)
                    .append(ul);
            },
            clearList: function() {
                multiSelector.results.length = 0;
                $(".multiselector-results").find("ul").empty();
            },
            addItemLimitInfoElement: function(count, max) {
                var message = "Showing " + count + " out of " + max + " matches";
                var infoElement = $(document.createElement("li"))
                    .addClass("multiselector-item-limit-info")
                    .text(message);

                $(".multiselector-results").find("ul").append(infoElement);
            }
        };

        var multiSelector = {
            version: "0.1-SNAPSHOT",
            targetElement: currentElement,
            options: helpers.parseOptions(options, defaultOptions),
            selected: {},
            results: {},
            previousText: ""
        };

        multiSelector.addObject = function(objectJson) {
            var newObject = JSON.parse(objectJson);

            if (objectAdded === "function") {
                objectAdded(newObject.id);
            }
        };

        multiSelector.removeObject = function(objectId) {
            if (objectRemoved === "function") {
                objectRemoved(objectId);
            }
        };

        multiSelector.toggleEnabled = function(objectId) {

        };

        multiSelector.getSelectedCount = function() {
            return this.selected.length;
        };

        multiSelector.returnSelectedObjects = function() {
            return this.selected;
        };

        //Make public getGroupingByName()
        multiSelector.getHelperFunctions = function() {
            return helpers;
        };

        // Function transforming the currently selected (with jQuery) element into the dropdown
        var transformElement = function() {

            var populateList = function() {
                if (multiSelector.results.length) {
                    var contacts = helpers.getGroupingByName(constants.groupingNames.contacts);
                    var groups = helpers.getGroupingByName(constants.groupingNames.groups);
                    var smartgroups = helpers.getGroupingByName(constants.groupingNames.smartgroups);

                    var contactsElement = resultsUl.append(helpers.createGroupElement(contacts)).find("ul");
                    if (contacts !== null && contacts.members.length > 0 &&
                        contactsElement.children().length >= multiSelector.options.itemDisplayLimit) {

                        helpers.addItemLimitInfoElement(contactsElement.children().length, contacts.members.length);
                        return;
                    }

                    resultsUl.append(helpers.createGroupElement(groups));
                    resultsUl.append(helpers.createGroupElement(smartgroups));
                }
            };

            var input = helpers.createInput();
            var results = helpers.createResultsDiv();
            var resultsUl = results.find("ul");

            var handleKeys = function(e) {
                var keyId = e.keyCode;
                var text = input.val();

                if (keyId === 13) {
                    helpers.clearList();
                    // Enter
                }
                else if (keyId === 188) {
                    helpers.clearList();
                    // Comma
                }

                if (text !== multiSelector.previousText)
                {
                    helpers.clearList();
                    if (text.length > 0 || multiSelector.previousText !== text) {
                        multiSelector.results = contactService.getFilteredMatches("", text);
                    }
                    populateList();
                }

                multiSelector.previousText = text;
            };

            currentElement.html(input);
            input.after(results);
            //Handling input
            input.keyup(handleKeys);
        };
        transformElement();

        // Return the selector object for public function access
        return multiSelector;
    };
}(jQuery));
