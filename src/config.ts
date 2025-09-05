const capabilities = {
  platformName: "ios",
  "appium:automationName": "xcuitest",
  "appium:udid": process.env["APPIUM_UDID"],
  "appium:xcodeOrgId": process.env["APPIUM_XCODE_ORG_ID"],
  "appium:xcodeSigningId": process.env["APPIUM_XCODE_SIGNING_ID"],
  "appium:updatedWDABundleId": process.env["APPIUM_UPDATED_WDA_BUNDLE_ID"],
  "appium:bundleId": "com.burbn.instagram", // Instagram app
};

export const wdOpts = {
  hostname: process.env["APPIUM_HOST"] || "localhost",
  port: parseInt(process.env["APPIUM_PORT"] || "4723", 10),
  logLevel: "info" as const,
  capabilities,
};
