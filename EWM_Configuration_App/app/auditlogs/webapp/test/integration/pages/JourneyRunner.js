sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"ns/auditlogs/test/integration/pages/AuditLogsList",
	"ns/auditlogs/test/integration/pages/AuditLogsObjectPage"
], function (JourneyRunner, AuditLogsList, AuditLogsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('ns/auditlogs') + '/test/flp.html#app-preview',
        pages: {
			onTheAuditLogsList: AuditLogsList,
			onTheAuditLogsObjectPage: AuditLogsObjectPage
        },
        async: true
    });

    return runner;
});

