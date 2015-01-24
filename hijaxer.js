
define(function () {
    "use strict";

    var XHR,
        logger = Log4js.getDefaultLogger("hiJAXer"),
        getXHR = function () {
            if ('undefined' !== typeof XMLHttpRequest) {
                return window.XMLHttpRequest;
            }
            else {
                throw new Error('No XHR object available.');
            }
        };

    return {
        /**
         * start method starts hiJAXer and sets up the proxy function on the XMLHTTPRequest object
         * @param options
         * @throws {Error} throws and error if the XMLHTTPRequest function is not available in the client host environment e.g. IE < 7
         */
        start: function (options) {

            try {
                XHR = getXHR();
            } catch (e) {
                throw new Error('Unable to start hiJAXer module:\n' + e.message + '.');
            }

            options || (options = {});
            var openXHR = XHR.prototype.open,
                sendXHR = XHR.prototype.send,
                that = this;

            XHR.prototype.proxy = function (response) {
                if (this.readyState === 4) {
                    if (this.status === 401) {
                        logger.info('Unauthorized access intercepted');

                        var data = {
                            title:   !!this.statusText ? this.statusText : 'Unauthorized access',
                            message: 'Your session has timed out.\nTo login again, please click \'OK\' to be redirected to the login screen.'
                        };

                        MessageEvent.trigger('modal:show', {
                            title:   data.title,
                            message: data.message,
                            context: this,
                            actions: {
                                "Cancel": function () {
                                    MessageEvent.trigger("modal:hide");
                                },
                                "OK":     function () {
                                    application.navigateRoute('/logout');
                                    location.pathname = location.pathname + '/logout';
                                    MessageEvent.trigger("modal:hide");


                                }
                            }
                        });
                    }
                }

                if ('function' === typeof this.callerReadyStateHandler) {
                    this.callerReadyStateHandler();
                }
            };

            XHR.prototype.open = function (method, url, async, user, pass) {
                openXHR.call(this, method, url, async, user, pass);
            };

            XHR.prototype.send = function (request) {

                var response = this.response;

                if (!this.passthrough) {
                    if (this.addEventListener) {
                        this.addEventListener('readystatechange', this.proxy.bind(this, response), false);
                    }
                    else {
                        this.callerReadyStateHandler = this.onreadystatechange;
                        this.onreadystatechange = this.proxy.bind(this, response);
                    }
                    this.passthrough = true;
                }

                sendXHR.call(this, request);
            };

            logger.debug('hiJAXer module started');
        }
    };
});
