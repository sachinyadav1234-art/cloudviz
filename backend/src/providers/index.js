const DemoAdapter = require("./demo/DemoAdapter");
const AWSAdapter = require("./aws/AWSAdapter");
const OCIAdapter = require("./oci/OCIAdapter");

function getAdapter(provider) {
  switch (provider) {
    case "DEMO": return new DemoAdapter();
    case "AWS": return new AWSAdapter();
    case "OCI": return new OCIAdapter();
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}

module.exports = { getAdapter };
