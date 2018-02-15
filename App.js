Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',

    requires: [
        'Rally.data.wsapi.Store',
        'Rally.data.wsapi.artifact.Store',
        'Rally.apps.printcards.PrintCard',
        'Rally.app.plugin.Print',
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
        var storyStore = Ext.create('Rally.data.wsapi.artifact.Store', {
            context: this.getContext().getDataContext(),
            models: ['User Story', 'Defect'],
            fetch: ['FormattedID', 'Name', 'Owner', 'Description', 'PlanEstimate', 'Tasks'],
            limit: (scope.getRecord()) ? 200 : 50,
            filters: [scope.getQueryFilter()]
        });

        storyStore.load().then({
            success: this._loadTasks,
            scope: this
        }).then({
            success: this._moveAlong.bind(this, storyStore),
            scope: this
        });
    },

    _loadTasks: function(stories) {
        var promises = [];
        _.each(stories, function(story) {
            var tasks = story.get('Tasks');
            if (tasks.Count > 0) {
                tasks.store = story.getCollection('Tasks');
                var taskLoad = tasks.store.load({
                    fetch: ['FormattedID', 'Name', 'State', 'Owner']
                });
                promises.push(taskLoad);
            }
        });
        return Deft.Promise.all(promises);
    },

    _moveAlong: function(storyStore) {
        this._assembleStoryTeams(storyStore);
        this._onStoriesLoaded(storyStore);
    },

    _assembleStoryTeams: function(storyStore) {
        _.each(storyStore.data.items, function(story) {
            var tasksStore = story.get('Tasks').store;

            story.data.storyTeam = (tasksStore) ?
                this._getStoryTeam(tasksStore.data.items) :
                '';
        }, this);
    },

    _getStoryTeam: function(tasks) {
        var names = _.map(tasks, function(task) {
            var owner = task.get('Owner');
            return owner ? owner._refObjectName : 'No Owner';
        });
        var unique = _.unique(names);
        var sorted = Ext.Array.sort(unique);

        var storyTeam = _.reduce(sorted, function(accumulator, value) {
            return accumulator + ', ' + value;
        });

        return storyTeam;
    },

    _onStoriesLoaded: function(storyStore) {
        var printCardHtml = '';
        var stories = storyStore.data.items;

        _.each(stories, function(story, idx) {
            printCardHtml += Ext.create('Rally.apps.printcards.PrintCard').tpl.apply(story.data);
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
