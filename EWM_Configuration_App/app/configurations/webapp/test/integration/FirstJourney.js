sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/JourneyRunner"
], function (opaTest, runner) {
    "use strict";

    function journey() {
        QUnit.module("First journey");

        opaTest("Start application", function (Given, When, Then) {
            Given.iStartMyApp();

            Then.onTheConfigurationsList.iSeeThisPage();
            Then.onTheConfigurationsList.onFilterBar().iCheckFilterField("Warehouse");
            Then.onTheConfigurationsList.onFilterBar().iCheckFilterField("Message Class");
            Then.onTheConfigurationsList.onFilterBar().iCheckFilterField("Active");
            Then.onTheConfigurationsList.onTable().iCheckColumns(7, {"warehouseNumber":{"header":"Warehouse"},"messageClass":{"header":"Message Class"},"messageNumber":{"header":"Message Number"},"messageDescription":{"header":"Message Description"},"notificationType":{"header":"Canal"},"emailAddress":{"header":"Email"},"isActive":{"header":"Active"}});

        });


        opaTest("Navigate to ObjectPage", function (Given, When, Then) {
            // Note: this test will fail if the ListReport page doesn't show any data
            
            When.onTheConfigurationsList.onFilterBar().iExecuteSearch();
            
            Then.onTheConfigurationsList.onTable().iCheckRows();

            When.onTheConfigurationsList.onTable().iPressRow(0);
            Then.onTheConfigurationsObjectPage.iSeeThisPage();

        });

        opaTest("Teardown", function (Given, When, Then) { 
            // Cleanup
            Given.iTearDownMyApp();
        });
    }

    runner.run([journey]);
});