using ConfigService as service from '../../../srv/config-service';

/**
 * ── FIORI ELEMENTS MAIN LAYOUT FOR CONFIGURATIONS ────────────────────────────
 * Drives the design of the principal List Report (table view) and Object Page (detail view).
 */
annotate service.Configurations with @(
  UI: {
    /**
     * Top-level page headers. Controls titles when navigating into details.
     */
    HeaderInfo: {
      TypeName       : 'Configuration',
      TypeNamePlural : 'Configurations',
      Title          : { Value: warehouseNumber }, // Main record identification title
      Description    : { Value: systemID }     // Dynamic operational context subtitle
    },

    /**
     * Column definition for the List Report layout table view.
     */
    LineItem: [
      {
        $Type : 'UI.DataField',
        Value : warehouseNumber,
        Label : 'Warehouse',
        ![@HTML5.CssDefaults] : { width: '6rem' }
      },
      {
        $Type : 'UI.DataField',
        Value : systemID,
        Label : 'System ID',
        ![@HTML5.CssDefaults] : { width: '5rem' }
      },
      {
        $Type : 'UI.DataField',
        Value : messageClass,
        Label : 'Message Class',
        ![@HTML5.CssDefaults] : { width: '7rem' }
      },
      {
        $Type : 'UI.DataField',
        Value : messageNumber,
        Label : 'Message Number',
        ![@HTML5.CssDefaults] : { width: '8rem' }
      },
      {
        $Type : 'UI.DataField',
        Value : messageDescription,
        Label : 'Message Description',
        ![@HTML5.CssDefaults] : { width: '10rem' }
      },
      {
        $Type : 'UI.DataField',
        Value : logicType_code, 
        Label : 'Logic',
        ![@HTML5.CssDefaults] : { width: '4rem' }
      },
      {
        $Type : 'UI.DataField',
        Value : actionType_code,
        Label : 'Action',
        ![@HTML5.CssDefaults] : { width: '4rem' }
      },
      {
        $Type : 'UI.DataField',
        Value : emailAddress,
        Label : 'Email',
        ![@HTML5.CssDefaults] : { width: '8rem' }
      },
      { 
        $Type : 'UI.DataField', 
        Value : rerunMessage,     
        Label : 'Rerun Message', 
        ![@HTML5.CssDefaults]: { width: '3rem' } 
      }
    ],

    /**
     * Search Filters available in the header filter bar component.
     */
    SelectionFields: [ warehouseNumber, messageClass],

    /**
     * Form Section structures on the Object Page.
     */
    Facets: [
      {
        $Type  : 'UI.ReferenceFacet',
        Label  : 'Message Details',
        Target : '@UI.FieldGroup#SectionMessage'
      },
      {
        $Type  : 'UI.ReferenceFacet',
        Label  : 'Execution',
        Target : '@UI.FieldGroup#SectionLogic'
      }
    ],

    FieldGroup #SectionMessage: {
      Data: [
        { Value: messageClass },
        { Value: messageNumber },
        { Value: messageDescription }
      ]
    },

    FieldGroup #SectionLogic: {
      Data: [
        { Value: actionType_code },
        { Value: logicType_code },
        { Value: emailAddress },
        { Value: rerunMessage }
      ]
    }
  }
);

/*
 * ── METADATA LABELS & INPUT CONTROLS ─────────────────────────────────────────
 * Configures basic UI presentation fields and attaches field-level requirements.
 */
annotate service.Configurations with {
  warehouseNumber    @Common.Label: 'Warehouse'           @mandatory;
  systemID           @Common.Label: 'System ID'           @mandatory;
  messageClass       @Common.Label: 'Message Class';
  messageNumber      @Common.Label: 'Message No.'         @mandatory;
  messageDescription @Common.Label: 'Message Description' @mandatory;
  emailAddress       @Common.Label: 'Email';
  logicType          @Common.Label: 'Logic Type'           @mandatory;
  actionType         @Common.Label: 'Action'               @mandatory;
  rerunMessage       @Common.Label: 'Rerun Message';
}

annotate service.Configurations with {
  warehouseNumber @Core.Immutable; 
  systemID        @Core.Immutable; 
}


/*
 * ── DROPDOWN CONFIGURATION (VALUE HELP SEARCH HELPER) ────────────────────────
 * Generates runtime search selectors for Association fields.
 */
annotate service.Configurations with {
  
  logicType @(
    Common.ValueListWithFixedValues : true, // Render as a strict dropdown/Select box instead of a popup dialog
    Common.TextArrangement : #TextFirst,    // Puts text values before codes in UI lists
    Common.ValueList : {
      Label          : 'Logic Type',
      CollectionPath : 'LogicTypes',        // Binds target dropdown lookup entity
      Parameters     : [
        {
          $Type             : 'Common.ValueListParameterInOut',
          LocalDataProperty : logicType_code, // Local property mapping value
          ValueListProperty : 'code'          // Target reference column mapping
        },
      ]
    }
  );

  actionType @(
    Common.ValueListWithFixedValues : true, // Render as a strict dropdown/Select box instead of a popup dialog
    Common.TextArrangement : #TextFirst,    // Puts text values before codes in UI lists
    Common.ValueList : {
      Label          : 'Action',
      CollectionPath : 'ActionTypes',       // Binds target dropdown lookup entity
      Parameters     : [
        {
          $Type             : 'Common.ValueListParameterInOut',
          LocalDataProperty : actionType_code, // Local property mapping value
          ValueListProperty : 'code'           // Target reference column mapping
        },
      ]
    }
  );
}