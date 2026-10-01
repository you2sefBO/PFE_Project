namespace ewm.monitoring;

// The 'cuid' aspect automatically adds a technical 'ID' field of type UUID 
//as the primary key for entities extending it.
using { cuid } from '@sap/cds/common';

/**
 * Reference table for logical conditions (e.g., 'AND', 'OR').
 * Used to populate the Value Help (dropdown list) in the Fiori UI.
 */
entity LogicTypes {
  key code        : String(3);   // Technical code (e.g., 'AND') - Primary Key
      description : String(50);  // Human-readable description displayed in the UI
}

/**
 * Reference table for action types .
 */
entity ActionTypes {
  key code        : String(20);  // Technical code of the action
      description : String(50);  // Human-readable description displayed in the UI
}

/**
 * Main Configuration Table.
 * Stores monitoring and processing rules for EWM message queue error handling.
 */
entity Configurations : cuid {
  warehouseNumber    : String(10)  not null; // Target Warehouse Number 
  systemID           : String(10)  not null; // Source or target SAP System ID
  messageClass       : String(20);           // SAP Message Class 
  messageNumber      : String(10)  not null; // SAP Message Number 
  messageDescription : String(255) not null; // description of the error 
  emailAddress       : String(100);          // Recipient email address if notification action is triggered 
  // Managed Associations (Jointures handled natively by CAP).
  logicType          : Association to LogicTypes;
  actionType         : Association to ActionTypes;
  rerunMessage       : Boolean     default false; // Flag to allow automatic message re-processing 

}


/**
 * Audit Trail Table.
 * Tracks all transactional mutations (CREATE, UPDATE, DELETE) made to the configurations.
 */
entity AuditLogs : cuid {
  entityName : String(100); // Technical name of the modified entity (e.g., 'Configurations')
  entityId   : UUID;        // The 'ID' value of the target row (Foreign key link to Configurations.ID)
  action     : String(20);  // Type of operation performed (CREATE, UPDATE, DELETE)
  fieldName  : String(100); // Technical field name that was changed
  oldValue   : String(500); // Previous value before change (empty string on CREATE)
  newValue   : String(500); // New value persisted in the database
  changedBy  : String(255); // User ID who performed the action
  changedAt  : Timestamp;   // Exact timestamp of the database commit
}