# PFE_Project

## 📌 Description

Ce projet consiste en la conception et la réalisation d'une solution automatisée de **monitoring des files d'attente SAP EWM en erreur**.

L'objectif principal est d'améliorer la supervision des erreurs SAP EWM en automatisant :

- la détection des messages en erreur ;
- l'application de règles de monitoring configurables ;
- le retraitement automatique des files lorsque cette option est activée ;
- la transmission des événements ;
- l'envoi de notifications par e-mail ;
- la traçabilité et la consultation de l'historique des alertes.

La solution s'appuie sur plusieurs technologies de l'écosystème SAP, notamment **SAP BTP, SAP CAP, SAP Event Mesh, SAP Alert Notification Service, SAP HANA Cloud, SAP Fiori Elements et ABAP**.

---

## 🏗️ Architecture

La solution est composée de deux parties principales :

### 1. Système SAP / SAP EWM

Un programme ABAP `ZEWM_QUEUE_MONITORING` est exécuté périodiquement par un **job SAP**.

Il permet de :

1. récupérer les règles de monitoring configurées ;
2. analyser les files d'attente qRFC SAP EWM ;
3. identifier les messages correspondant aux règles ;
4. effectuer, si configuré, le retraitement automatique ;
5. publier les événements vers SAP Event Mesh.

### 2. SAP BTP

L'application développée sur SAP BTP assure la réception, le traitement et le suivi des alertes.

Elle permet notamment de :

- gérer les règles de monitoring ;
- recevoir les événements provenant de SAP Event Mesh ;
- agréger les alertes similaires ;
- éviter les notifications redondantes ;
- envoyer les notifications via SAP Alert Notification Service ;
- enregistrer les alertes dans SAP HANA Cloud ;
- consulter l'historique via une interface SAP Fiori.

---

## 🔄 Flux de fonctionnement

```text
                 SAP EWM
                    │
                    │
             Job SAP planifié
                    │
                    ▼
          ABAP - Queue Monitoring
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
   Règles de monitoring    Détection erreur
          │                   │
          └─────────┬─────────┘
                    │
                    ▼
              SAP Event Mesh
                    │
                    ▼
              SAP CAP Service
                    │
          ┌─────────┼──────────┐
          │         │          │
          ▼         ▼          ▼
       Agrégation  HANA     Alertes
          │        Cloud        │
          │                     ▼
          │              Alert Notification
          │                     │
          │                     ▼
          │                   Email
          │
          ▼
     Fiori Elements
   Historique des alertes
