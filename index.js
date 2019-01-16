"use strict";

const jayson = require('jayson/lib/client/browser')
const axios = require('axios');

const AUTHENTICATION_PATH = '/web/session/authenticate';
const API_PATH = '/web/dataset/call_kw';

const ODOO_CALL_KW_ENDPOINT = '/web/dataset/call_kw';
const ODOO_CALL_ENDPOINT = '/web/dataset/call';
const ODOO_SEARCH_READ_ENDPOINT = '/web/dataset/search_read';


class OdooRPC {
    constructor(config) {
        

        config = config || {};

        this.host = config.host;
        this.port = config.port || 80;
        this.database = config.database;
        this.persist = config.persist;
        this.username = null;
        this.password = null;
        this.uid = null;
        this.sid = null;
        this.sessionId = null;
        this.context = null;

        if(config.persist == 'localStorage') {
            console.log("Reloade from LOCAL")
            const data = JSON.parse(localStorage.getItem('odoo-data'))
            console.log(data);
            if(data) {
                this.uid = data.uid;
                this.sessionId = data.sessionId;
                this.context = data.context;
                this.username = data.username;
                this.password = data.password;
                this.partnerId = data.partnerId;
            }
        }
    }

    isAuthenticated() {
        return this.uid && this.sessionId
    }

    logout() {
        this.uid = null;
        this.sessionId = null;
        this.context = null;

        if(this.persist == 'localStorage') {
            localStorage.setItem('odoo-data', JSON.stringify(this));
        }
    }
    
    login(username, password) {
        

        return new Promise((resolve, reject) => {
            var params = {
                db: this.database,
                login: username,
                password: password
            };
            
            var json = JSON.stringify({ params: params });
            var options = {
                url: `${this.host}:${this.port}/web/session/authenticate`,
                method: 'post',
                data: json,
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
            };

            axios(options)
                .then(response => {
                    if(!response.data.result.uid) {
                        reject("Username or password not valid")
                    } else {
                        this.uid = response.data.result.uid;
                        this.partnerId = response.data.result.partner_id;
                        this.sessionId = response.data.result.session_id;
                        this.context = response.data.result.user_context;
                        this.username = username;
                        this.password = password;
    
                        if(this.persist == 'localStorage') {
                            localStorage.setItem('odoo-data', JSON.stringify(this));
                        }

                        resolve(response.data.result);
                    }
                })
                .catch(error => reject(error))
        })
    }

    env(model) {
        return new OdooResource(this, model);
    }

    _request(path, params) {
        params = params || {args: []};
        path = path || '/'
        
        const auth = [
            this.database,
            this.uid,
            this.password
        ]
        params.args = auth.concat(params.args)

        const callServer = (request, callback) => {
            var options = {
                url: `${this.host}:${this.port}/jsonrpc`,
                method: 'post',
                data: request,
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
            };
            
            axios(options)
                .then(response => callback(null, JSON.stringify(response.data)))
                .catch(error => callback(error))

        }

        return new Promise((resolve, reject) => {
            const client = jayson(callServer)
            client.request('call', params, (err, error, result) => {
                if(err) {
                    reject(error)
                } else {
                    resolve(result);
                }

            })
        })
    }
}

class OdooResource {
    constructor(client, model) {
        this.client = client;
        this.model = model;
    }

    create(data) {
        if(!Array.isArray(data)) {
            data = [data]
        }

        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            service: 'object',
            method: 'execute_kw',
            args: [
                this.model,
                'create',
                data
            ]
        })        
    }

    call(method, params) {
        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            service: 'object',
            method: 'execute_kw',
            args: [
                this.model,
                method,
                params
            ]
        })
    }

    browse(ids) {
        if(!Array.isArray(ids)) {
            ids = [ids]
        }
        console.log('--> ', ids)
        return this.client._request(ODOO_CALL_ENDPOINT, {
            service: 'object',
            method: 'execute_kw',
            args: [
                this.model,
                'read',
                [ids]
            ]
        })
        .then(result => {
            return ids.length == 1 ? result[0] : result
        });
    }

    write(ids, data) {
        if(!Array.isArray(ids)) {
            ids = [ids]
        }

        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            service: 'object',
            method: 'execute_kw',
            args: [
                this.model,
                'write',
                [ids, data]
            ]
        }).then(result => {
            return ids.length == 1 ? result[0] : result
        });
    }

    unlink(ids) {
        if(!Array.isArray(ids)) {
            ids = [ids]
        }
        
        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            service: 'object',
            method: 'execute_kw',
            args: [
                this.model,
                'unlink',
                [ids]
            ]
        });
    }

    search(params) {
        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            service: 'object',
            method: 'execute_kw',
            args: [
                this.model,
                'search',
                [params]
            ]
        });
    }

    search_count(params) {
        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            service: 'object',
            method: 'execute_kw',
            args: [
                this.model,
                'search_count',
                [params]
            ]
        });
    }

    search_read(domain= [], fields= [], limit= 0, offset= 0, sort= '') {
        if (!fields.length) return console.error("The search_read method doesn't support an empty fields array.");

        return this.client._request(ODOO_SEARCH_READ_ENDPOINT, {
            service: 'object',
            method: 'execute_kw',
            args: [
                this.model,
                'search_read',
                [domain],
                {
                    fields,
                    limit,
                    offset
                }
            ]
        })
    }

    fields_get(fields= [], attributes= {}) {
        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            kwargs: {
                context: this.client.context
            },
            model: this.model,
            method: 'fields_get',
            args: [fields, attributes]
        });
    }
    
}

module.exports = OdooRPC