(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.apps.printcards.PrintCard', {
        extend: 'Ext.Component',
        alias: 'widget.printcard',
        tpl: Ext.create('Ext.XTemplate', '<tpl><div class="artifact">' +
            '<div class="card-header">' +
            '<span class="formattedid {[this.getCardType(values)]}">{FormattedID}{[this.getParentID(values)]}</span>' +
            '<span class="owner">{[this.getOwnerImage(values)]}</span>' +
            '<span class="ownerText">{[this.getOwnerName(values)]}</span>' +
            '</div>' +
            '<div class="content">' +
            '<div class="name">{Name}</div>' +
            '<div class="description">{Description}</div>' +
            '</div>' +
            '<span class="planestimate">{[this.getEstimate(values)]}</span>' +
            '</div></tpl>', {
                getOwnerImage: function(values) {
                    //return values.Owner && ('<img src="' + Rally.util.User.getProfileImageUrl(40,values.Owner._ref) + '"/>') || '';
                    return '';
                },
                getOwnerName: function(values) {
                    //return values.Owner && values.Owner._refObjectName || 'No Owner';
                    return values.storyTeam;
                },
                getParentID: function(values) {
                    return values.WorkProduct && (':' + values.WorkProduct.FormattedID) || '';
                },
                // Tasks have Estimate(s), Stories have PlanEstimate(s)
                getEstimate: function(values) {
                    return values.Estimate || values.PlanEstimate || 'None';
                },
                getCardType: function(values) {
                    var result = 'story';
                    if (values.FormattedID.startsWith("DE")) {
                        result = 'defect';
                    } else if (values.Name.toLowerCase().includes('spike')) {
                        result = 'spike'
                    }
                    return result;
                }

            }
        )
    });
})();
