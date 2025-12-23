/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect } from "chai";
import McpServerCommand from "../../src/commands/mcp.js";

describe("McpServerCommand", () => {
  describe("static properties", () => {
    it("should have a description", () => {
      expect(McpServerCommand.description).to.be.a("string");
      expect(McpServerCommand.description).to.include("MCP Server");
    });

    it("should have examples", () => {
      expect(McpServerCommand.examples).to.be.an("array");
      expect(McpServerCommand.examples.length).to.be.greaterThan(0);
    });

    it("should define toolsets flag", () => {
      const toolsetsFlag = McpServerCommand.flags.toolsets;
      expect(toolsetsFlag).to.not.be.undefined;
    });

    it("should define tools flag", () => {
      const toolsFlag = McpServerCommand.flags.tools;
      expect(toolsFlag).to.not.be.undefined;
    });

    it("should define allow-non-ga-tools flag with default false", () => {
      const flag = McpServerCommand.flags["allow-non-ga-tools"];
      expect(flag).to.not.be.undefined;
      expect(flag.default).to.equal(false);
    });

    it("should inherit config flag from BaseCommand", () => {
      // config flag is inherited from BaseCommand.baseFlags
      const flag = McpServerCommand.baseFlags.config;
      expect(flag).to.not.be.undefined;
    });

    it("should inherit debug flag from BaseCommand", () => {
      const flag = McpServerCommand.baseFlags.debug;
      expect(flag).to.not.be.undefined;
    });

    it("should inherit log-level flag from BaseCommand", () => {
      const flag = McpServerCommand.baseFlags["log-level"];
      expect(flag).to.not.be.undefined;
    });

    it("should support environment variables for flags", () => {
      expect(McpServerCommand.flags.toolsets.env).to.equal("SFCC_TOOLSETS");
      expect(McpServerCommand.flags.tools.env).to.equal("SFCC_TOOLS");
      expect(McpServerCommand.flags["allow-non-ga-tools"].env).to.equal(
        "SFCC_ALLOW_NON_GA_TOOLS",
      );
      // config flag env is inherited from BaseCommand
      expect(McpServerCommand.baseFlags.config.env).to.equal("SFCC_CONFIG");
    });
  });

  describe("flag parse functions", () => {
    it("should uppercase toolsets input", async () => {
      const parse = McpServerCommand.flags.toolsets.parse;
      if (parse) {
        const result = await parse(
          "cartridges,mrt",
          {} as never,
          {} as never,
        );
        expect(result).to.equal("CARTRIDGES,MRT");
      }
    });

    it("should lowercase tools input", async () => {
      const parse = McpServerCommand.flags.tools.parse;
      if (parse) {
        const result = await parse(
          "CARTRIDGE_DEPLOY,MRT_BUNDLE_PUSH",
          {} as never,
          {} as never,
        );
        expect(result).to.equal("cartridge_deploy,mrt_bundle_push");
      }
    });
  });
});

