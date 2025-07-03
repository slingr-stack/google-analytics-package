/**
 * @fileoverview
 * This script initializes Google Analytics and tracks application events
 * by intercepting XMLHttpRequest requests.
 * It has been refactored for better readability, code deduplication,
 * and maintainability by separating concerns.
 */

(function initializeGATracking() {
    // This section injects the gtag script and configures it.
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-Q31RSJXCFB';
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    // Configure GA: Disable automatic page_view events to avoid conflicts.
    // We will send our own custom 'view_accessed' event.
    gtag('config', 'G-Q31RSJXCFB', {
        'send_page_view': false,
        'debug_mode':true
    });

    /**
     * Safely tries to parse a JSON string. If it fails, it returns the original data.
     * @param {*} data - The data to parse.
     * @returns {object | any} - The parsed object or the original data.
     */
    function tryParseJSON(data) {
        try {
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
            // Not a valid JSON, return the original data.
            return data;
        }
    }

    /**
     * Sends an event to Google Analytics and logs it to the console.
     * @param {string} eventName - The event name for GA.
     * @param {object} params - The parameters for the event.
     */
    function sendAndLogGAEvent(eventName, params) {
        console.log(`[GA] Sending event: ${eventName}`, params);
        gtag('event', eventName, params);
    }

    /**
     * Processes events related to job completions.
     * @param {object} response - The parsed response body.
     * @param {object} pageInfo - Current page information.
     */
    function handleActionEvents(response, pageInfo) {
        const { type, status, hasErrors, data, duration, recordsProcessed } = response;
        const jobTypes = ['EXECUTE_ACTION', 'IMPORT_RECORDS', 'EXPORT_RECORDS'];

        if (status === 'FINISHED' && !hasErrors && jobTypes.includes(type)) {
            let actionName = data?.actionName;
            if (type === 'IMPORT_RECORDS') actionName = 'importRecords';
            if (type === 'EXPORT_RECORDS') actionName = 'exportRecords';

            if (actionName) {
                sendAndLogGAEvent('action_executed_' + actionName, {
                    ...pageInfo,
                    action_name: actionName,
                    entity: data?.entityName,
                    duration: duration,
                    records_processed: recordsProcessed,
                });
            }
        }
    }

    /**
     * Processes record creation, editing, and deletion events.
     * @param {string} method - The HTTP method (POST, PUT, DELETE).
     * @param {object} requestBody - The original request body.
     * @param {object} response - The parsed response body.
     * @param {object} pageInfo - Current page information.
     */
    function handleDataEvents(method, requestBody, response, pageInfo) {
        const { entity, label, version } = response;
        const entityName = entity?.name;

        if (!entityName || !label) return;

        if (method === 'POST' && version === 0) {
            sendAndLogGAEvent('record_created', { ...pageInfo, entity: entityName, label: label });
        } else if (method === 'PUT') {
            const reqBodyParsed = tryParseJSON(requestBody);
            if (typeof reqBodyParsed?.version === 'number' && version > reqBodyParsed.version) {
                sendAndLogGAEvent('record_edited', { ...pageInfo, entity: entityName, label: label });
            }
        } else if (method === 'DELETE') {
            sendAndLogGAEvent('record_deleted', { ...pageInfo, entity: entityName, label: label });
        }
    }

    /**
     * Processes authentication events (login/logout).
     * @param {string} url - The request URL.
     * @param {object} pageInfo - Current page information.
     */
    function handleAuthEvents(url, pageInfo) {
        let eventName;
        if (url.includes('/api/auth/login')) {
            eventName = 'login';
        } else if (url.includes('/api/auth/logout')) {
            eventName = 'logout';
        }

        if (eventName) {
            sendAndLogGAEvent(eventName, { ...pageInfo, method: 'platform' });
        }
    }

    /**
     * Processes view access events.
     * @param {object} response - The parsed response body.
     * @param {object} pageInfo - Current page information.
     */
    function handleViewAccessedEvents(response, pageInfo) {
        const { label, entity, viewBreadCrumb, type, systemFields } = response;
        const entityName = entity?.name || 'none';

        if (!label || !entityName) {
            return;
        }

        let pageTitle;
        if (viewBreadCrumb && viewBreadCrumb.length > 0) {
            pageTitle = viewBreadCrumb[viewBreadCrumb.length - 1].label;
        } else {
            pageTitle = type === "COLLECTION_VIEW" ? label : systemFields?.label;
        }

        if (pageTitle) {
            sendAndLogGAEvent('view_accessed', {
                ...pageInfo,
                entity: entityName,
                view: label,
                page_title: pageTitle,
            });
        }
    }

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._gaTrackMethod = method;
        this._gaTrackUrl = url;
        return originalOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (body) {
        this._gaTrackBody = body;

        this.addEventListener('load', function () {
            if (this.status < 200 || this.status >= 300) {
                return;
            }

            const method = this._gaTrackMethod.toUpperCase();
            const url = this._gaTrackUrl;
            const responseParsed = tryParseJSON(this.response);
            const pageInfo = {
                page_location: window.location.href,
                page_path: window.location.pathname + window.location.search + window.location.hash
            };

            if (method === 'GET' && url.includes('/api/status/jobs/')) {
                handleActionEvents(responseParsed, pageInfo);
            } else if (method === 'GET' && url.includes('/auditLogs')) {
                sendAndLogGAEvent('action_executed_auditLogs', pageInfo);
            } else if (['POST', 'PUT', 'DELETE'].includes(method) && url.includes('/api/data/')) {
                handleDataEvents(method, this._gaTrackBody, responseParsed, pageInfo);
            } else if (method === 'POST' && url.includes('/api/auth/')) {
                handleAuthEvents(url, pageInfo);
            } else if (['GET', 'POST'].includes(method) && url.includes('/api/ui/default/views/')) {
                handleViewAccessedEvents(responseParsed, pageInfo);
            }
        });

        return originalSend.call(this, body);
    };

})();
