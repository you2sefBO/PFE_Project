using { ewm.monitoring as db } from '../db/schema';

@path: '/api'
service EwmAlertService {

  @restrict: [
    { grant: '*',    to: ['ADMIN']    },
    { grant: '*',    to: ['OPERATOR'] },
    { grant: 'READ', to: ['VIEWER']   }
  ]
  entity EwmAlertLog as projection on db.EwmAlertLog order by alertedAt desc;

  @requires: 'any'
  action receiveAlert(
    warehouseNumber    : String,
    systemID           : String,
    messageClass       : String,
    messageNumber      : String,
    messageDescription : String,
    queueName          : String,
    busobject          : String,
    busobjectKey       : String
  ) returns String;
}