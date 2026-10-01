sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/JourneyRunner"
], function (opaTest, runner) {
    "use strict";

    function journey() {
        QUnit.module("First journey");

        opaTest("Start application", function (Given, When, Then) {
            Given.iStartMyApp();

            Then.onTheAuditLogsList.iSeeThisPage();
            Then.onTheAuditLogsList.onFilterBar().iCheckFilterField("Entity");
            Then.onTheAuditLogsList.onFilterBar().iCheckFilterField("Action");
            Then.onTheAuditLogsList.onFilterBar().iCheckFilterField("Changed By");
            Then.onTheAuditLogsList.onFilterBar().iCheckFilterField("Changed At");
            Then.onTheAuditLogsList.onTable().iCheckColumns(7, {"entityName":{"header":"Entity"},"action":{"header":"Action"},"fieldName":{"header":"Field"},"oldValue":{"header":"Old Value"},"newValue":{"header":"New Value"},"changedBy":{"header":"Changed By"},"changedAt":{"header":"Changed At"}});

        });


        opaTest("Navigate to ObjectPage", function (Given, When, Then) {
            // Note: this test will fail if the ListReport page doesn't show any data
            
            When.onTheAuditLogsList.onFilterBar().iExecuteSearch();
            
            Then.onTheAuditLogsList.onTable().iCheckRows();

            When.onTheAuditLogsList.onTable().iPressRow(0);
            Then.onTheAuditLogsObjectPage.iSeeThisPage();

        });

        opaTest("Teardown", function (Given, When, Then) { 
            // Cleanup
            Given.iTearDownMyApp();
        });
    }

    runner.run([journey]);
});