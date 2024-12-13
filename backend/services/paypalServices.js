const paypal = require("@paypal/checkout-server-sdk");

const environment = new paypal.core.SandboxEnvironment(
  "AVSkCcjzchqBmVwSv0yLxVD0vhiHcXClntmTyY6By0_mKvBLEp0IzYJd6UIU2_0vEvfgLJZ51suLEOS7",
  "EPHe4zK46KMB3EqNGJ9gHnUGGLaurSN2EOfMNyvspgAXcWR-ABXL7k3BhbSe3byLt5pv0ZNLXC8dmpCr"
);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

module.exports = paypalClient;
