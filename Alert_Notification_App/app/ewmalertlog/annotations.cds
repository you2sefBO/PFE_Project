using EwmAlertService as service from '../../srv/ewm-alert-service';

// ── UI Annotations for EwmAlertLog List Report ──────────────────────────
annotate service.EwmAlertLog with @(

  UI.HeaderInfo : {
    TypeName       : 'Alert Log',
    TypeNamePlural : 'Alert Logs',
    Title          : { Value: messageDescription },
    Description    : { Value: alertedAt }
  },

  // Columns displayed in the list view
  UI.LineItem : [
    { $Type: 'UI.DataField', 
      Value: alertedAt,          
      Label: 'Timestamp',
      ![@HTML5.CssDefaults] : { width: '7rem' }      
    },
    { $Type: 'UI.DataField', 
    Value: warehouseNumber,    
    Label: 'Warehouse',
    ![@HTML5.CssDefaults] : { width: '6rem' }      
    },
    { $Type: 'UI.DataField',
      Value: messageClass,       
      Label: 'Message Class',
      ![@HTML5.CssDefaults] : { width: '8rem' }  
    },
    { $Type: 'UI.DataField', 
      Value: messageNumber,      
      Label: 'Message No.',
      ![@HTML5.CssDefaults] : { width: '8rem' }    
    },
    { $Type: 'UI.DataField', 
      Value: messageDescription, 
      Label: 'Description',
      ![@HTML5.CssDefaults] : { width: '8rem' }   
    },
    { $Type: 'UI.DataField', 
      Value: sendStatus,         
      Label: 'Status',
      ![@HTML5.CssDefaults] : { width: '7rem' }         
    },
    { $Type: 'UI.DataField', 
      Value: emailSentTo,        
      Label: 'Sent To',
      ![@HTML5.CssDefaults] : { width: '7rem' }        
    },
    { $Type: 'UI.DataField', 
      Value: sendError,          
      Label: 'Error',
      ![@HTML5.CssDefaults] : { width: '7rem' }          
    }
  ],
  // Detail page layout
  UI.Facets : [
    {
      $Type  : 'UI.ReferenceFacet',
      Label  : 'General Information',
      Target : '@UI.FieldGroup#GeneralData'
    },
    {
      $Type  : 'UI.ReferenceFacet',
      Label  : 'Technical Delivery Details',
      Target : '@UI.FieldGroup#TechnicalData'
    }
  ],

  // General information section
  UI.FieldGroup#GeneralData : { Data: [
    { Value: warehouseNumber,    Label: 'Warehouse'         },
    { Value: systemID,           Label: 'System ID'         },
    { Value: messageClass,       Label: 'Message Class'     },
    { Value: messageNumber,      Label: 'Message Number'    },
    { Value: messageDescription, Label: 'Error Description' },
    { Value: queueName,          Label: 'Queue Name'        },
    { Value: busobject,          Label: 'Business Object'   },
    { Value: busobjectKey,       Label: 'Business Object Key'},
    { Value: alertedAt,          Label: 'Log Date & Time'   }
  ]},

  // Technical delivery section
  UI.FieldGroup#TechnicalData : { Data: [
    { Value: emailSentTo, Label: 'Sent To'              },
    { Value: sendStatus,  Label: 'Delivery Result'      },
    { Value: sendError,   Label: 'System Error Message' }
  ]}
);

annotate service.EwmAlertLog with @(
  UI.PresentationVariant : {
    Visualizations : [ '@UI.LineItem' ],
    SortOrder : [
      {
        $Type : 'Common.SortOrderType',
        Property : alertedAt,
        Descending : true
      }
    ]
  }
);