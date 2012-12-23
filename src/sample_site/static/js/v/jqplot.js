define(["jquery", "backbone", "backbone-tastypie", "jquery.jqplot"], function($, Backbone) {
    "use strict";

    /**
     * Takes two hashes and merges them, returning the merged hash
     *  That is, it goes through all elements in the array and
     *   combines hashes, otherwise prefering the second hash.
     * @param hash1 The "default" hash
     * @param hash2 The "preferred" hash
     */
    function mergeHash(hash1, hash2) {
        var out = {};
        for(var key in hash2) {
            if(hash2[key] != null) {
                if(typeof hash2[key] == "object" && hash1[key] != null) {
                    // Recurse and merge
                    out[key] = mergeHash(hash1[key], hash2[key]);
                } else {
                    // Else, take the specified value over the default
                    out[key] = hash2[key];
                }
            }
        }
        return out;
    }

    var view = Backbone.View.extend({
        jqplotOptions: {
            axesDefaults: {
                tickRenderer: $.jqplot.CanvasAxisTickRenderer ,
            },
            axes: {
              xaxis: {
                renderer: $.jqplot.CategoryAxisRenderer
              },
            }
        },
        /**
         * This method is responsible for initializing all the variables,
         *  scanning through the supplied options and meshing them with our defaults,
         *  and setting anything that needs to be set
         * You must call fetch for the graphs to render!
         * You can specify the following in the constructor:
         *  -> jqplotOptions
         *  -> variables
         *  -> variableType
         *  -> collection
         *  -> ticks
         */
        initialize: function() {
            if(this.options.jqplotOptions != null) {
                this.jqplotOptions = mergeHash(this.jqplotOptions, this.options.jqplotOptions);
            }
            // Make sure a collection is specified
            if(this.options.collection == null) {
                throw "A collection must be specified to query against!";
            }
            // Make sure both X and Y values are specified
            if(this.options.variables == null) {
                throw "An array of variables is required.";
            }

            if(this.options.variableType == null) {
                this.variableType = "lines";
            } else {
                this.variableType = this.options.variableType;
            }

            this.variables = this.options.variables;
            this.ticks = this.options.ticks;

            this.collection.bind('reset', this.render, this);

            self = this;

            this.failure = this.options.failure;
            //this.options.collection.fetch({success: this.fetchComplete, failure: this.fetchFailure});
        },

        /**
         * This is called after the collection has been fetched
         */
        render: function() {
            // Create the list that will be fed into jqplot
            var elements;
            
            if(this.variableType == "groups") {
                elements = this.dataGroups();
            } else if(this.variableType="lines") {
                elements = this.dataLines();
            } else {
                throw "Unknown variable type: " + this.variableType;
            }
            console.log(elements);

            // Get the ticks, if they are needed
            if(this.ticks != null) {
                this.jqplotOptions['axes']['xaxis']['ticks'] = this.ticks(this.collection);
            }

            console.log(this.jqplotOptions);

            $.jqplot($(this.el).attr('id'), elements, this.jqplotOptions);
        },

        dataGroups: function() {
            var self = this;
            var elements = [];
            this.collection.forEach(function(e) {
                for(var i=0; i < self.variables.length; i++) {
                    if(elements[i] == null)
                        elements.push([]);
                    elements[i].push(e.get(self.variables[i]));
                }
            });
            return elements;
        },

        dataLines: function() {
            var elements = []
            var self = this;
            this.collection.forEach(function(e) {
                var elements_inner = [];
                for(var i=0; i < self.variables.length; i++) {
                    elements_inner.push(e.get(self.variables[i]));
                }
                elements.push(elements_inner);
            });
            return [elements];
        },

        /**
         * This function calls the function specified by the "failure" element in the prototype
         */
        fetchFailure: function(collection, response, options) {
            // This is bad. Call the user specified failure function? Or throw?
            if(this.failure != null)
                this.failure(response);
            else
                throw "Failed to fetch data: " + response;
        }
    });

    return view;
});