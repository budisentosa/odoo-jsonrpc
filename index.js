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
        this.username = config.username;
        this.password = config.password;
        this.uid = null;
        this.sid = null;
        this.sessionId = null;
        this.context = null;
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            var params = {
                db: this.database,
                login: this.username,
                password: this.password
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
                    this.uid = response.data.result.uid
                    this.sessionId = response.data.result.session_id
                    this.context = response.data.result.user_context
                    
                    resolve(response)
                })
                .catch(error => reject(error))
        })
    }

    env(model) {
        return new OdooResource(this, model);
    }

    _request(path, params) {
        params = params || {};
        path = path || '/'
        

        const callServer = (request, callback) => {
            var options = {
                url: `${this.host}:${this.port}${path}`,
                method: 'post',
                data: request,
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Cookie': `session_id=${this.sessionId};`
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
        console.log(data)
        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            kwargs: {
                context: this.client.context
            },
            model: this.model,
            method: 'create',
            args: data
        })        
    }

    browse(ids) {
        if(!Array.isArray(ids)) {
            ids = [ids]
        }
        return this.client._request(ODOO_CALL_ENDPOINT, {
            model: this.model,
            method: 'read',
            args: ids
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
            kwargs: {
                context: this.client.context
            },
            model: this.model,
            method: 'write',
            args: [ids, data]
        }).then(result => {
            return ids.length == 1 ? result[0] : result
        });
    }

    unlink(ids) {
        if(!Array.isArray(ids)) {
            ids = [ids]
        }
        
        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            kwargs: {
                context: this.client.context
            },
            model: this.model,
            method: 'unlink',
            args: [ids]
        });
    }

    search(params) {
        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            kwargs: {
                context: this.client.context
            },
            model: this.model,
            method: 'search',
            args: [params]
        });
    }

    search_count(params) {
        return this.client._request(ODOO_CALL_KW_ENDPOINT, {
            kwargs: {
                context: this.client.context
            },
            model: this.model,
            method: 'search_count',
            args: [params]
        });
    }

    search_read(domain= [], fields= [], limit= 0, offset= 0, sort= '') {
        if (!fields.length) return console.error("The search_read method doesn't support an empty fields array.");

        return this.client._request(ODOO_SEARCH_READ_ENDPOINT, {
            context: this.client.context,
            model: this.model,
            domain,
            fields,
            limit,
            offset,
            sort
        })
        .then(result => result.records);
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