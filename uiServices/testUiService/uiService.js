service.testFunction = function (message) {
    console.log('[skeleton] test function arrived ', message);
    service.callback(message, 'callbackTest');
};