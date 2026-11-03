# XML Schema validator (libxml2 → WebAssembly)

`b2c validate`, the MCP `validate_xml_schema` tool, and the SDK `xml-validation` module validate XML with
[libxml2](https://gitlab.gnome.org/GNOME/libxml2) compiled to WebAssembly. The build output in
[`data/xml-validator/`](../../data/xml-validator) is committed so that installing the SDK needs no compiler and
pulls in no third-party npm packages.

| File              | Purpose                                                                        |
| ----------------- | ------------------------------------------------------------------------------ |
| `build.sh`        | Downloads libxml2 (checksum-verified), compiles it, and links the module.      |
| `Dockerfile`      | Pins the Emscripten toolchain image by digest.                                 |
| `xml_validator.c` | Entry points over the libxml2 reader and XML Schema APIs; returns diagnostics. |

The module contains only the libxml2 parser, streaming reader, and XML Schema support (no HTTP, catalogs,
iconv, zlib, or threads). Documents are parsed with `XML_PARSE_NONET | XML_PARSE_NO_XXE`, and the module uses
an in-memory filesystem, so it cannot read host files or make network requests.

## Rebuilding

Requires Docker.

```bash
./build.sh            # writes ../../data/xml-validator/
./build.sh /tmp/out   # writes elsewhere
```

The build is reproducible: the same inputs produce byte-identical files on any host architecture
(`DOCKER_PLATFORM=linux/amd64 ./build.sh` to check). The `XML Validator Build` workflow rebuilds on every change
to this directory or the artifacts and fails if the committed files differ.

## Updating libxml2 or Emscripten

1. Update `LIBXML2_VERSION` and `LIBXML2_SHA256` in `build.sh` (checksums are published next to the tarballs at
   `download.gnome.org`), or the image tag and digest in `Dockerfile`.
2. Run `./build.sh` and commit the changed artifacts together with the source change.
3. Run the SDK and CLI tests, and add a changeset for `@salesforce/b2c-tooling-sdk`.

Watch the libxml2 release notes for security fixes in the parser, reader, or XML Schema code.

## Licenses

libxml2 and Emscripten (including musl) are MIT-licensed or similarly permissive. `build.sh` collects their
notices into `data/xml-validator/THIRD-PARTY-NOTICES`, which ships with the artifacts.
