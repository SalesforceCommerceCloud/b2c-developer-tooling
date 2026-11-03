/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * Minimal XML Schema validation entry points over libxml2, compiled to
 * WebAssembly. Inputs are read from the Emscripten in-memory filesystem; the
 * module has no access to the host filesystem or network.
 *
 * Diagnostics are accumulated in a buffer as one record per line:
 *   level \t line \t column \t domain \t code \t message
 * where level is 1 (warning), 2 (error) or 3 (fatal).
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <emscripten/emscripten.h>
#include <libxml/parser.h>
#include <libxml/xmlerror.h>
#include <libxml/xmlreader.h>
#include <libxml/xmlschemas.h>

#define MAX_DIAGNOSTICS 1000

/* No network, no external entities, no DTD loading, no system catalog. */
#define PARSE_OPTIONS (XML_PARSE_NONET | XML_PARSE_NO_XXE | XML_PARSE_NO_SYS_CATALOG)

static char *diag_buf = NULL;
static size_t diag_len = 0;
static size_t diag_cap = 0;
static int diag_count = 0;
static int diag_truncated = 0;

static void diag_reset(void) {
  diag_len = 0;
  diag_count = 0;
  diag_truncated = 0;
  if (diag_buf) diag_buf[0] = '\0';
}

static void diag_append(const char *s, size_t n) {
  if (diag_len + n + 1 > diag_cap) {
    size_t cap = diag_cap ? diag_cap : 4096;
    while (diag_len + n + 1 > cap) cap *= 2;
    char *next = realloc(diag_buf, cap);
    if (!next) return;
    diag_buf = next;
    diag_cap = cap;
  }
  memcpy(diag_buf + diag_len, s, n);
  diag_len += n;
  diag_buf[diag_len] = '\0';
}

static void on_error(void *user_data, const xmlError *err) {
  (void)user_data;
  if (!err) return;
  if (diag_count >= MAX_DIAGNOSTICS) {
    diag_truncated = 1;
    return;
  }
  diag_count++;

  char head[96];
  int n = snprintf(head, sizeof head, "%d\t%d\t%d\t%d\t%d\t", (int)err->level, err->line, err->int2, err->domain,
                   err->code);
  diag_append(head, (size_t)n);

  /* Flatten the message onto a single line. */
  const char *msg = err->message ? err->message : "";
  size_t len = strlen(msg);
  while (len > 0 && (msg[len - 1] == '\n' || msg[len - 1] == '\r' || msg[len - 1] == ' ')) len--;
  for (size_t i = 0; i < len; i++) {
    char c = msg[i];
    if (c == '\n' || c == '\r' || c == '\t') c = ' ';
    diag_append(&c, 1);
  }
  diag_append("\n", 1);
}

EMSCRIPTEN_KEEPALIVE
const char *xv_diagnostics(void) { return diag_buf ? diag_buf : ""; }

EMSCRIPTEN_KEEPALIVE
int xv_diagnostics_truncated(void) { return diag_truncated; }

EMSCRIPTEN_KEEPALIVE
const char *xv_libxml_version(void) { return xmlParserVersion; }

/* Compiles the schema at `path`. Returns an opaque handle, or 0 on failure. */
EMSCRIPTEN_KEEPALIVE
xmlSchemaPtr xv_schema_load(const char *path) {
  diag_reset();
  xmlSchemaParserCtxtPtr pctxt = xmlSchemaNewParserCtxt(path);
  if (!pctxt) return NULL;
  xmlSchemaSetParserStructuredErrors(pctxt, on_error, NULL);
  xmlSchemaPtr schema = xmlSchemaParse(pctxt);
  xmlSchemaFreeParserCtxt(pctxt);
  return schema;
}

EMSCRIPTEN_KEEPALIVE
void xv_schema_free(xmlSchemaPtr schema) {
  if (schema) xmlSchemaFree(schema);
}

/*
 * Streams the document at `path` through the reader, validating against
 * `schema` when it is non-null (well-formedness only otherwise).
 * Returns 0 when valid, 1 when invalid, 2 when the document could not be opened.
 */
EMSCRIPTEN_KEEPALIVE
int xv_validate(xmlSchemaPtr schema, const char *path) {
  diag_reset();
  xmlTextReaderPtr reader = xmlReaderForFile(path, NULL, PARSE_OPTIONS);
  if (!reader) return 2;
  xmlTextReaderSetStructuredErrorHandler(reader, on_error, NULL);

  xmlSchemaValidCtxtPtr vctxt = NULL;
  int ok = 1;
  if (schema) {
    vctxt = xmlSchemaNewValidCtxt(schema);
    if (!vctxt || xmlTextReaderSchemaValidateCtxt(reader, vctxt, 0) != 0) ok = 0;
    if (vctxt) xmlSchemaSetValidStructuredErrors(vctxt, on_error, NULL);
  }

  int ret = 0;
  while (ok && (ret = xmlTextReaderRead(reader)) == 1) {
  }
  if (ok && ret != 0) ok = 0;
  if (ok && schema && xmlTextReaderIsValid(reader) != 1) ok = 0;

  xmlFreeTextReader(reader);
  if (vctxt) xmlSchemaFreeValidCtxt(vctxt);
  return ok ? 0 : 1;
}
