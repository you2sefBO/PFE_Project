sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"ns/configurations/test/integration/pages/ConfigurationsList",
	"ns/configurations/test/integration/pages/ConfigurationsObjectPage"
], function (JourneyRunner, ConfigurationsList, ConfigurationsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('ns/configurations') + '/test/flp.html#app-preview',
        pages: {
			onTheConfigurationsList: ConfigurationsList,
			onTheConfigurationsObjectPage: ConfigurationsObjectPage
        },
        async: true
    });

    return runner;
});

