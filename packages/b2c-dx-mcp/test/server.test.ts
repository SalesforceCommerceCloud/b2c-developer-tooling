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
import { B2CDxMcpServer } from "../src/server.js";

describe("B2CDxMcpServer", () => {
  describe("constructor", () => {
    it("should create server with name and version", () => {
      const server = new B2CDxMcpServer({
        name: "test-server",
        version: "1.0.0",
      });

      expect(server).to.be.instanceOf(B2CDxMcpServer);
    });

    it("should accept optional server options", () => {
      const server = new B2CDxMcpServer(
        { name: "test-server", version: "1.0.0" },
        { capabilities: {} },
      );

      expect(server).to.be.instanceOf(B2CDxMcpServer);
    });
  });

  describe("addTool", () => {
    let server: B2CDxMcpServer;

    beforeEach(() => {
      server = new B2CDxMcpServer({
        name: "test-server",
        version: "1.0.0",
      });
    });

    it("should register a tool without throwing", () => {
      expect(() => {
        server.addTool(
          "test_tool",
          "A test tool",
          { type: "object", properties: {} },
          async () => ({ content: [{ type: "text", text: "ok" }] }),
        );
      }).to.not.throw();
    });

    it("should register multiple tools", () => {
      expect(() => {
        server.addTool(
          "tool_one",
          "First tool",
          { type: "object", properties: {} },
          async () => ({ content: [{ type: "text", text: "one" }] }),
        );

        server.addTool(
          "tool_two",
          "Second tool",
          { type: "object", properties: {} },
          async () => ({ content: [{ type: "text", text: "two" }] }),
        );
      }).to.not.throw();
    });

    it("should accept tools with input schema", () => {
      expect(() => {
        server.addTool(
          "parameterized_tool",
          "A tool with parameters",
          {
            type: "object",
            properties: {
              name: { type: "string", description: "Name parameter" },
              count: { type: "number", description: "Count parameter" },
            },
            required: ["name"],
          },
          async (args) => ({
            content: [{ type: "text", text: `Hello ${args.name}` }],
          }),
        );
      }).to.not.throw();
    });
  });

  describe("isConnected", () => {
    it("should return false when not connected", () => {
      const server = new B2CDxMcpServer({
        name: "test-server",
        version: "1.0.0",
      });

      expect(server.isConnected()).to.be.false;
    });
  });
});

