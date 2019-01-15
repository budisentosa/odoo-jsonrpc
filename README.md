# Odoo JsonRPC

Odoo JSON RPC client for browser and Node.js with support for Promises

## Usage

Initialize odoo client

```javascript
const odoo = new OdooRPC({
    host: 'http://localhost',
    database: 'demo_enterprise',
    username: 'admin',
    password: 'admin',
})
```


### Browse

Fetch object by id (multiple or single id)

```javascript
const partner_ids = await odoo.env('res.partner').browse(1)

```

or

```javascript
const partner_ids = await odoo.env('res.partner').browse([1,2,3])

```

### Create

```javascript
const id = await odoo.env('res.partner').create({
    name: 'Test',
    email: 'test@example.com'
})
```

### Write

```javascript
await odoo.env('res.partner').write(1, {
    name: 'Test',
    email: 'test@example.com'
})
```

or

```javascript
await odoo.env('res.partner').write([1, 2, 3], {
    name: 'Test',
    email: 'test@example.com'
})
```

### Search 

```javascript
const partner_ids = await odoo.env('res.partner').search([
    ['name', '=', 'Test']
])
```


### Search Read

```javascript
const partner_ids = await odoo.env('res.partner').search_read([
    ['name', '=', 'Test']
], ['name', 'email'])
```


### Search Count

```javascript
const total = await odoo.env('res.partner').search_count([
    ['name', '=', 'Test']
])
```


