<template>
  <section class="home-packages">
    <div class="container vp-doc">
      <h2 id="packages">Packages</h2>
      <table>
        <thead>
          <tr><th>Package</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><a href="https://www.npmjs.com/package/@salesforce/b2c-cli"><code>@salesforce/b2c-cli</code></a></td>
            <td>Command-line tools for Salesforce B2C Commerce</td>
          </tr>
          <tr>
            <td><a href="https://www.npmjs.com/package/@salesforce/b2c-dx-mcp"><code>@salesforce/b2c-dx-mcp</code></a></td>
            <td>MCP Server for AI-assisted development</td>
          </tr>
          <tr>
            <td><a href="https://www.npmjs.com/package/@salesforce/b2c-tooling-sdk"><code>@salesforce/b2c-tooling-sdk</code></a></td>
            <td>SDK library for custom integrations</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.home-packages {
  padding: 0 24px;
  margin-top: 64px;
}

@media (min-width: 640px) {
  .home-packages {
    padding: 0 48px;
  }
}

@media (min-width: 960px) {
  .home-packages {
    padding: 0 64px;
  }
}

.container {
  margin: 0 auto;
  max-width: 1152px;
}
</style>
