Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',

    requires: [
        'Rally.data.wsapi.Store',
        'Rally.apps.printcards.PrintCard',
        'Rally.app.plugin.Print'
    ],
    plugins: [{
        ptype: 'rallyappprinting'
    }],
    scopeType: 'iteration',
    autoScroll: true,

    launch: function() {
        this.add({
            xtype: 'container',
            itemId: 'cards'
        });
        this.callParent(arguments);
    },

    onScopeChange: function(scope) {
        this.down('#cards').getEl().setHTML('');
        this._loadStories(scope);
    },

    _loadStories: function(scope) {
        Ext.create('Rally.data.wsapi.artifact.Store', {
            context: this.getContext().getDataContext(),
            autoLoad: true,
            models: ['User Story', 'Defect'],
            fetch: ['FormattedID', 'Name', 'Owner', 'Description', 'PlanEstimate', 'Tasks'],
            limit: (scope.getRecord()) ? 200 : 50,
            listeners: {
                load: this._doMore,
                scope: this
            },
            filters: [
                scope.getQueryFilter()
            ]
        });
    },

    _doMore: function(store, records) {

        _.each(records, function(record, idx) {

            record.getCollection('Tasks').load({
                fetch: ['FormattedID', 'Name', 'State', 'Owner'],
                callback: function(taskRecords, operation, success) {

                    var names = Ext.Array.map(taskRecords, function(task) {
                        //console.log(task.get('FormattedID') + ' - ' + task.get('Name') + ': ' + task.get('State'));
                        return task.get('Owner')._refObjectName;
                    }, this);

                    var unique = Ext.Array.unique(names);
                    var sorted = Ext.Array.sort(unique);
                    var storyTeam = '';
                    Ext.Array.each(sorted, function(value) {
                        storyTeam += (storyTeam ? ', ' + value : value);
                    });

                    record.data.storyTeam = storyTeam;
                },
                scope: this
            });

        }, this);

        setTimeout(function(target, myStore, myRecords) {
            target._onStoriesLoaded(myStore, myRecords);
        }, 3000, this, store, records);

    },

    _onStoriesLoaded: function(store, records) {
        var printCardHtml = '';

        _.each(records, function(record, idx) {
            printCardHtml += Ext.create('Rally.apps.printcards.PrintCard').tpl.apply(record.data);
            if (idx % 4 === 3) {
                printCardHtml += '<div class="pb"></div>';
            }
        }, this);

        Ext.DomHelper.insertHtml('beforeEnd', this.down('#cards').getEl().dom, printCardHtml);

        if (Rally.BrowserTest) {
            Rally.BrowserTest.publishComponentReady(this);
        }
    },

    getOptions: function() {
        return [
            this.getPrintMenuOption({
                title: 'Print Rally Cards App'
            })
        ];
    }

});
