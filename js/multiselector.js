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
            itemDisplayLimit: 25
        };

        var parseOptions = function(options, defaultOptions) {
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

            return options;
        };

        var multiSelector = {
            version: "0.1-SNAPSHOT",
            targetElement: currentElement,
            options: parseOptions(options, defaultOptions),
            selected: {},
            results: {}
        };

        var constants = {
            types: {
                contact: 'contact',
                group: 'group'
            },
            regexPatterns: {
                contactId: /^contact\-\d+$/ig,
                groupId: /^group\-\d+$/ig
            }
        };

        var getObjectTypeFromId = function(objectId) {
            if (objectId.matches(constants.regexPatterns.contactId)) {
                return constants.types.contact;
            } else if (objectId.matches(constants.regexPatterns.groupId)) {
                return constants.types.group;
            }
            return null;
        };

        var getSelectedObjectById = function(objectId) {
            return this.selected[objectId];
        };

        multiSelector.addObject = function(objectJson) {
            // TODO: Return the added object Id
            // TODO: Store the object's type in itself for easier classification and searching
        };

        multiSelector.removeObject = function(objectId) {
            // TODO: Return the removed object Id
        };

        multiSelector.toggleEnabled = function(objectId) {

        };

        multiSelector.getSelectedCount = function() {
            return this.selected.length;
        };

        multiSelector.returnSelectedObjects = function() {
            return this.selected;
        };

        // Function transforming the currently selected (with jQuery) element into the dropdown
        var transformElement = function(target) {
            var createInput = function() {
                return $(document.createElement("input"))
                    .addClass("multiselector-input")
                    .width(multiSelector.options.width);
            };

            var createResultsDiv = function() {
                return $(document.createElement("div"))
                    .addClass("multiselector-results")
                    .width(multiSelector.options.width)
                    .height(multiSelector.options.minResultsHeight);
            };

            var input = createInput();
            var results = createResultsDiv();

            currentElement.html(input);
            input.after(results);
        };
        transformElement(currentElement);

        // Return the selector object for public function access
        return multiSelector;
    };
}(jQuery));
