/****************************************************
 Configuration builder

 The configuration object should be built to configure the package dependencies

 ****************************************************/

let configurationBuilder = function (config) {
    sys.logs.info("[skeleton] Configuration builder");
    sys.logs.info("[skeleton] Config: " + JSON.stringify(config));
    return config;
}
