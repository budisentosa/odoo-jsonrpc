const OdooRpc = require("./index")

const options = {
  host: "http://localhost",
  database: "donodoo"
}

test("Connect to odoo", async () => {
  const odoo = new OdooRpc(options)
  await odoo.login("admin", "admin")
  expect(odoo.uid).toBeTruthy()
})

test("Create res.partner", async () => {
  const odoo = new OdooRpc({
    host: "http://localhost",
    database: "donodoo"
  })
  await odoo.login("admin", "admin")
  try {
    const partner_id = await odoo.env("res.partner").create({
      name: "John Doe",
      email: "john.doe@example.com"
    })

    expect(partner_id).toBeTruthy()
  } catch (e) {
    expect(1 === 2).toBeTruthy()
  }
})

test("Read res.user", async () => {
  const odoo = new OdooRpc({
    host: "http://localhost",
    database: "donodoo"
  })
  await odoo.login("admin", "admin")
  const data = await odoo.env("res.users").read([2,1])
  expect(data.length === 2).toBeTruthy()
})

test("Read res.user name", async () => {
  const odoo = new OdooRpc({
    host: "http://localhost",
    database: "donodoo"
  })
  await odoo.login("admin", "admin")
  const data = await odoo.env("res.users").read(2, ["login"])
  expect(data.login).toBeTruthy()
})
