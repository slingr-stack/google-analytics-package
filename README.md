# Overview

This package provides a UI Service to track user activity in your Slingr application and send it to Google Analytics using custom events.

It automatically tracks:
- User login
- User logout
- Access to views
- Record creation, update, and deletion
- Action execution

It uses an approach based on intercepting HTTP requests, avoiding the need to manually detect UI events.

## QuickStart

To set up Google Analytics with this UI Service:

1. Go to [Google Analytics](https://analytics.google.com/) and sign in.
2. Create a new property (or use an existing one).
3. Go to **Admin > Data Streams > Web** and create a new stream.
4. Copy the **Measurement ID** (it starts with `G-`).
5. Create an environment variable in your app named `GA_MEASUREMENT_ID` with your Google Analytics Measurement ID.
6. Add this package to your app.


## Requirements

- You must define the environment variable `GA_MEASUREMENT_ID` in your app.

## Event Details

| Event Name        | Trigger Description |
|-------------------|---------------------|
| `login`           | On successful login |
| `logout`          | On logout |
| `view_accessed`   | When a user accesses any view |
| `record_created`  | When a record is created |
| `record_updated`  | When a record is updated |
| `record_deleted`  | When a record is deleted |
| `action_executed` | After an action job finishes successfully |

All events include context like `entity`, `label`, and `page_path`.

## UI Service

This package uses a UI service that injects tracking logic directly into the front-end of your Slingr app.
It listens to XHR requests and analyzes their content to determine user actions.

<details>
  <summary>Click here to see some technical details</summary>

It uses a global XHR monkey-patching strategy to intercept all XHR traffic and match it against known patterns like:

- `POST /api/data/:entityId` → Create record
- `PUT /api/data/:entityId/:recordId` → Update record
- `DELETE /api/data/:entityId/:recordId` → Delete record
- `POST /api/actions/execute` followed by polling `/api/status/jobs/:jobId` → Action execution
- `GET /api/ui/default/views/:viewId` → View access

</details>

## About Slingr

Slingr is a low-code rapid application development platform that accelerates development, with robust architecture for integrations and executing custom workflows and automation.

[More info about Slingr](https://slingr.io)

## License

This package is licensed under the Apache License 2.0. See the `LICENSE` file for more details.