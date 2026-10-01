namespace ewm.monitoring;
using { cuid } from '@sap/cds/common';
/**
 * EwmAlertLog — Stores the history of all alerts sent to the team.
 * Each record represents one alert triggered by the EWM Queue Monitor.
 */
entity EwmAlertLog : cuid {
  warehouseNumber    : String(10);   // EWM Warehouse
  systemID           : String(20);   // Source System ID
  messageClass       : String(20);   // SAP Message Class 
  messageNumber      : String(10);   // SAP Message Number
  messageDescription : String(255);  // Error description from the queue
  queueName          : String(50);   // Technical queue name
  emailSentTo        : String(100);  // Recipient email address
  busobject          : String(50);   // Business object related to the alert
  busobjectKey       : String(100);  // Key of the business object
  alertedAt          : Timestamp;    // Timestamp when the alert was sent
  sendStatus         : String(10);   // SUCCESS or FAILED
  sendError          : String(500);  // Error details if sending failed
}



