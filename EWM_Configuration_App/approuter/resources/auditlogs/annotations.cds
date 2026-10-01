using ConfigService as service from '../../../srv/config-service';

annotate service.AuditLogs with @(

  UI.HeaderInfo: {
    TypeName       : 'Audit Log',
    TypeNamePlural : 'Audit Logs',
    Title          : { Value: entityName },
    Description    : { Value: action }
  },

  
  UI.LineItem: [
    {
      $Type : 'UI.DataField',
      Value : entityName,
      Label : 'Entity',
      ![@HTML5.CssDefaults] : { width: '7rem' }
    },
    {
      $Type : 'UI.DataField',
      Value : action,
      Label : 'Action',
    ![@HTML5.CssDefaults] : { width: '6rem' }
    },
    {
      $Type : 'UI.DataField',
      Value : fieldName,
      Label : 'Field',
    ![@HTML5.CssDefaults] : { width: '10rem' }
    },
    {
      $Type : 'UI.DataField',
      Value : oldValue,
      Label : 'Old Value',
    ![@HTML5.CssDefaults] : { width: '8rem' }
    },
    {
      $Type : 'UI.DataField',
      Value : newValue,
      Label : 'New Value',
    ![@HTML5.CssDefaults] : { width: '10rem' }
    },
    {
      $Type : 'UI.DataField',
      Value : changedBy,
      Label : 'Changed By',
    ![@HTML5.CssDefaults] : { width: '6rem' }
    },
    {
      $Type : 'UI.DataField',
      Value : changedAt,
      Label : 'Changed At',
    ![@HTML5.CssDefaults] : { width: '7rem' }
    }
  ],

  
  UI.SelectionFields: [
    entityName,
    action,
    changedBy,
    changedAt
  ],

  
  UI.Facets: [
    {
      $Type  : 'UI.ReferenceFacet',
      Label  : 'Audit Details',
      Target : '@UI.FieldGroup#Main'
    }
  ],

  UI.FieldGroup#Main: {
    Data: [
      { Value: entityName, Label: 'Entity' },
      { Value: action, Label: 'Action' },
      { Value: fieldName, Label: 'Field' },
      { Value: oldValue, Label: 'Old Value' },
      { Value: newValue, Label: 'New Value' },
      { Value: changedBy, Label: 'Changed By' },
      { Value: changedAt, Label: 'Changed At' }
    ]
  }
);


annotate service.AuditLogs with @(
  UI.CreateHidden : true,
  UI.UpdateHidden : true,
  UI.DeleteHidden : true
);


annotate service.AuditLogs with {
  entityName @title: 'Entity';
  action     @title: 'Action';
  fieldName  @title: 'Field';
  oldValue   @title: 'Old Value';
  newValue   @title: 'New Value';
  changedBy  @title: 'Changed By';
  changedAt  @title: 'Changed At';
};

annotate service.AuditLogs with @(
  UI.PresentationVariant : {
    Visualizations : [ '@UI.LineItem' ], 
    SortOrder : [
      {
        $Type : 'Common.SortOrderType',
        Property : changedAt,
        Descending : true
      }
    ]
  }
);